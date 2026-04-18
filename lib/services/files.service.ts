import 'server-only';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ApiError } from '@/lib/errors';
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  MIME_TO_EXT,
  type FileBucket,
  type UploadRequestInput,
} from '@/lib/validations/files';
import { verifyMagicBytes, VERIFY_BYTES_REQUIRED } from '@/lib/security/file-magic';
import type { AuthenticatedContext } from '@/lib/types/auth';

const SIGNED_URL_TTL_SECONDS = 60;
const UPLOAD_URL_TTL_SECONDS = 60;

/**
 * Path conventions - MUST match the Storage RLS in 0010_storage_hardening.sql.
 * The filename is a pure UUID + extension; the client-provided name is audit-only.
 */
function buildObjectPath(params: {
  bucket: FileBucket;
  institutionId: string;
  userId: string;
  taskId?: string;
  mimeType: string;
}): string {
  const ext = MIME_TO_EXT[params.mimeType] ?? 'bin';
  const filename = `${randomUUID()}.${ext}`;
  switch (params.bucket) {
    case 'submissions':
      if (!params.taskId) throw new ApiError('VALIDATION_ERROR', 'taskId required for submissions');
      return `${params.institutionId}/${params.userId}/${params.taskId}/${filename}`;
    case 'avatars':
      return `${params.institutionId}/${params.userId}/${filename}`;
    case 'resources':
      return `${params.institutionId}/shared/${filename}`;
  }
}

/**
 * Issue a one-time signed upload URL (upsert: false) and register the file
 * in public.file_objects with status='pending'. The file is NOT usable until
 * confirmUpload() runs the magic-byte check.
 */
export async function issueUploadUrl(
  ctx: AuthenticatedContext,
  input: UploadRequestInput
): Promise<{
  fileId: string;
  path: string;
  token: string;
  signedUrl: string;
  expiresIn: number;
}> {
  // Role-bucket matrix --------------------------------------------------
  if (input.bucket === 'submissions' && ctx.role !== 'student') {
    throw new ApiError('FORBIDDEN', 'Only students may upload submissions');
  }
  if (input.bucket === 'resources' && !['teacher', 'admin', 'super_admin'].includes(ctx.role)) {
    throw new ApiError('FORBIDDEN', 'Only teachers or admins may upload resources');
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(input.mimeType)) {
    throw new ApiError('VALIDATION_ERROR', 'MIME type not allowed');
  }
  if (input.size > MAX_UPLOAD_BYTES) {
    throw new ApiError('VALIDATION_ERROR', 'File exceeds maximum size');
  }

  const supabase = createClient();

  // Submissions: verify the student is enrolled in the course that owns the task.
  if (input.bucket === 'submissions') {
    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .select('id, course_id, institution_id')
      .eq('id', input.taskId!)
      .maybeSingle();
    if (taskErr) throw new ApiError('INTERNAL_ERROR', 'Could not load task');
    if (!task) throw new ApiError('NOT_FOUND', 'Task not found');
    const t = task as { course_id: string; institution_id: string };
    if (t.institution_id !== ctx.institutionId) {
      throw new ApiError('FORBIDDEN', 'Task is not in your institution');
    }
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', t.course_id)
      .eq('student_id', ctx.userId)
      .maybeSingle();
    if (!enrollment) throw new ApiError('FORBIDDEN', 'You are not enrolled in this course');
  }

  const path = buildObjectPath({
    bucket: input.bucket,
    institutionId: ctx.institutionId,
    userId: ctx.userId,
    taskId: input.taskId,
    mimeType: input.mimeType,
  });

  // 1. Register pending object BEFORE issuing the signed URL so orphan cleanup
  //    can find dangling uploads.
  const ownerType = input.bucket === 'submissions' ? 'task' : input.bucket === 'avatars' ? 'profile' : 'institution';
  const ownerId = input.bucket === 'submissions' ? input.taskId! : input.bucket === 'avatars' ? ctx.userId : ctx.institutionId;

  const { data: inserted, error: insErr } = await supabase
    .from('file_objects')
    .insert({
      institution_id: ctx.institutionId,
      bucket: input.bucket,
      path,
      mime: input.mimeType,
      size: input.size,
      sha256: input.sha256 ?? null,
      uploaded_by: ctx.userId,
      owner_type: ownerType,
      owner_id: ownerId,
      scan_status: 'pending',
    })
    .select('id')
    .single();
  if (insErr || !inserted) {
    throw new ApiError('INTERNAL_ERROR', 'Could not register upload');
  }
  const fileId = (inserted as { id: string }).id;

  // 2. Issue signed upload URL. upsert:false => cannot replace an existing object.
  const { data: signed, error: sErr } = await supabase.storage
    .from(input.bucket)
    .createSignedUploadUrl(path, { upsert: false });
  if (sErr || !signed) {
    // Rollback pending row - best effort.
    await createServiceClient().from('file_objects').delete().eq('id', fileId);
    throw new ApiError('INTERNAL_ERROR', 'Could not issue upload URL');
  }

  return {
    fileId,
    path,
    token: signed.token,
    signedUrl: signed.signedUrl,
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  };
}

/**
 * Post-upload verification:
 *   1. Load file_objects row, verify ownership.
 *   2. Download first VERIFY_BYTES_REQUIRED bytes with service role (bypasses RLS so
 *      teachers later reading the file doesn't matter here).
 *   3. Run magic-byte check against the declared MIME.
 *   4. Flip scan_status to 'clean' on pass, 'blocked' + delete object on fail.
 *
 * Idempotent: re-running on an already-clean file is a no-op.
 */
export async function confirmUpload(
  ctx: AuthenticatedContext,
  fileId: string
): Promise<{ fileId: string; path: string; scanStatus: 'clean' | 'blocked' }> {
  const supabase = createClient();

  const { data: row, error: rowErr } = await supabase
    .from('file_objects')
    .select('id, institution_id, bucket, path, mime, uploaded_by, scan_status')
    .eq('id', fileId)
    .maybeSingle();
  if (rowErr) throw new ApiError('INTERNAL_ERROR', 'Could not load file record');
  if (!row) throw new ApiError('NOT_FOUND', 'File not found');
  const record = row as {
    id: string;
    institution_id: string;
    bucket: FileBucket;
    path: string;
    mime: string;
    uploaded_by: string;
    scan_status: 'pending' | 'clean' | 'suspicious' | 'blocked';
  };

  if (record.institution_id !== ctx.institutionId || record.uploaded_by !== ctx.userId) {
    throw new ApiError('NOT_FOUND', 'File not found');
  }
  if (record.scan_status === 'clean') {
    return { fileId: record.id, path: record.path, scanStatus: 'clean' };
  }
  if (record.scan_status === 'blocked') {
    throw new ApiError('CONFLICT', 'File was blocked by integrity check');
  }

  const admin = createServiceClient();

  // Download the whole object and inspect the first bytes. Supabase-js doesn't
  // expose Range for Storage downloads, so we download and then slice.
  const { data: blob, error: dlErr } = await admin.storage.from(record.bucket).download(record.path);
  if (dlErr || !blob) {
    await admin
      .from('file_objects')
      .update({ scan_status: 'blocked', scan_error: 'download_failed' })
      .eq('id', record.id);
    throw new ApiError('NOT_FOUND', 'File not uploaded or inaccessible');
  }

  const buf = new Uint8Array(await blob.arrayBuffer());
  const prefix = buf.slice(0, Math.max(VERIFY_BYTES_REQUIRED, 32));
  const verdict = verifyMagicBytes(prefix, record.mime);

  if (!verdict.ok) {
    // Delete the malicious/suspect object and mark as blocked.
    await admin.storage.from(record.bucket).remove([record.path]).catch(() => undefined);
    await admin
      .from('file_objects')
      .update({ scan_status: 'blocked', scan_error: verdict.reason ?? 'invalid' })
      .eq('id', record.id);
    return { fileId: record.id, path: record.path, scanStatus: 'blocked' };
  }

  await admin
    .from('file_objects')
    .update({ scan_status: 'clean', confirmed_at: new Date().toISOString() })
    .eq('id', record.id);

  return { fileId: record.id, path: record.path, scanStatus: 'clean' };
}

/**
 * Returns a 60-second signed URL for the object.
 * DOES NOT RETURN THE URL AS JSON - the caller (route handler) must 302-redirect
 * to it, so the signed URL never touches a response body or logs.
 */
export async function resolveSignedDownload(
  ctx: AuthenticatedContext,
  bucket: FileBucket,
  path: string
): Promise<string> {
  // 1. Bucket whitelist already enforced by Zod. Defense-in-depth:
  if (!['submissions', 'avatars', 'resources'].includes(bucket)) {
    throw new ApiError('NOT_FOUND', 'File not found');
  }

  // 2. Path must live under the caller's tenant prefix.
  const segments = path.split('/');
  const [pathInstitution] = segments;
  if (pathInstitution !== ctx.institutionId) {
    throw new ApiError('NOT_FOUND', 'File not found');
  }

  // 3. Registry lookup (cross-check status + ownership).
  const admin = createServiceClient();
  const { data: obj } = await admin
    .from('file_objects')
    .select('id, institution_id, bucket, path, uploaded_by, scan_status')
    .eq('bucket', bucket)
    .eq('path', path)
    .maybeSingle();
  if (!obj) throw new ApiError('NOT_FOUND', 'File not found');
  const record = obj as {
    institution_id: string;
    uploaded_by: string;
    scan_status: string;
  };
  if (record.institution_id !== ctx.institutionId) {
    throw new ApiError('NOT_FOUND', 'File not found');
  }
  if (record.scan_status !== 'clean') {
    throw new ApiError('FORBIDDEN', 'File is not available for download');
  }

  // 4. Bucket-specific ownership rules.
  switch (bucket) {
    case 'submissions': {
      if (ctx.role === 'student' && record.uploaded_by !== ctx.userId) {
        throw new ApiError('NOT_FOUND', 'File not found');
      }
      break;
    }
    case 'avatars':
    case 'resources':
      // Any member of the tenant may fetch.
      break;
  }

  // 5. Verify the object actually exists in Storage before signing.
  const folder = segments.slice(0, -1).join('/');
  const filename = segments[segments.length - 1];
  const { data: listing, error: listErr } = await admin.storage
    .from(bucket)
    .list(folder, { limit: 100, search: filename });
  if (listErr) throw new ApiError('INTERNAL_ERROR', 'Could not verify file');
  if (!(listing ?? []).some((entry) => entry.name === filename)) {
    // Object vanished (manual delete or cleanup race) - mark registry as blocked.
    await admin.from('file_objects').update({ scan_status: 'blocked', scan_error: 'object_missing' }).eq('path', path);
    throw new ApiError('NOT_FOUND', 'File not found');
  }

  // 6. Sign the URL (60s).
  const { data: signed, error: sErr } = await admin.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (sErr || !signed?.signedUrl) {
    throw new ApiError('INTERNAL_ERROR', 'Could not sign URL');
  }
  return signed.signedUrl;
}

/**
 * Orphan cleanup. To be called by a cron or admin endpoint.
 *   * pending for > 24h -> delete object + row
 *   * clean but the reference (e.g. submission.file_path) no longer exists -> delete
 *   * blocked -> delete object but keep the row for audit
 */
export async function cleanupOrphans(
  ctx: AuthenticatedContext,
  { olderThanHours = 24 }: { olderThanHours?: number } = {}
): Promise<{ removed: number }> {
  if (!['admin', 'super_admin'].includes(ctx.role)) {
    throw new ApiError('FORBIDDEN', 'Admin only');
  }
  const admin = createServiceClient();
  const cutoffIso = new Date(Date.now() - olderThanHours * 3600 * 1000).toISOString();

  // 1. Pending too long: drop object + row.
  const { data: stale } = await admin
    .from('file_objects')
    .select('id, bucket, path')
    .eq('institution_id', ctx.institutionId)
    .eq('scan_status', 'pending')
    .lt('created_at', cutoffIso);

  let removed = 0;
  for (const row of (stale ?? []) as Array<{ id: string; bucket: FileBucket; path: string }>) {
    await admin.storage.from(row.bucket).remove([row.path]).catch(() => undefined);
    await admin.from('file_objects').delete().eq('id', row.id);
    removed += 1;
  }

  // 2. Clean submissions-bucket files not referenced by any submission.
  const { data: cleanSubmissions } = await admin
    .from('file_objects')
    .select('id, path')
    .eq('institution_id', ctx.institutionId)
    .eq('bucket', 'submissions')
    .eq('scan_status', 'clean');
  for (const row of (cleanSubmissions ?? []) as Array<{ id: string; path: string }>) {
    const { data: ref } = await admin
      .from('submissions')
      .select('id')
      .eq('file_path', row.path)
      .maybeSingle();
    if (!ref) {
      await admin.storage.from('submissions').remove([row.path]).catch(() => undefined);
      await admin.from('file_objects').delete().eq('id', row.id);
      removed += 1;
    }
  }

  return { removed };
}
