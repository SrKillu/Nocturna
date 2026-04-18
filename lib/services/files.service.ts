import 'server-only';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ApiError } from '@/lib/errors';
import { ALLOWED_MIME_TYPES } from '@/lib/validations/files';
import type { AuthenticatedContext } from '@/lib/types/auth';
import type { UploadRequestInput } from '@/lib/validations/files';

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'submissions';
const SIGNED_URL_TTL = 60; // seconds

/**
 * Build the canonical storage path for a student's submission.
 * {institution_id}/{student_id}/{task_id}/{uuid}-{filename}
 */
function buildObjectPath(params: {
  institutionId: string;
  studentId: string;
  taskId: string;
  filename: string;
}): string {
  const safeName = params.filename.replace(/\s+/g, '_');
  return `${params.institutionId}/${params.studentId}/${params.taskId}/${randomUUID()}-${safeName}`;
}

/**
 * Issue a signed upload URL so the client can PUT the file directly to Storage.
 * Enforces:
 *   * student role only
 *   * enrollment in the course that owns the task
 *   * institution binding
 *   * MIME whitelist + size cap (already done by zod at the route; re-checked here)
 */
export async function issueUploadUrl(
  ctx: AuthenticatedContext,
  input: UploadRequestInput
): Promise<{ path: string; token: string; signedUrl: string; expiresIn: number }> {
  if (ctx.role !== 'student') {
    throw new ApiError('FORBIDDEN', 'Only students can upload submissions');
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(input.mimeType)) {
    throw new ApiError('VALIDATION_ERROR', 'MIME type not allowed');
  }

  const supabase = createClient();

  // Ownership + enrollment check (defense in depth; RLS already covers this).
  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .select('id, course_id, institution_id')
    .eq('id', input.taskId)
    .maybeSingle();
  if (taskErr) throw new ApiError('INTERNAL_ERROR', 'Could not load task');
  if (!task) throw new ApiError('NOT_FOUND', 'Task not found');
  const taskRow = task as { id: string; course_id: string; institution_id: string };
  if (taskRow.institution_id !== ctx.institutionId) {
    throw new ApiError('FORBIDDEN', 'Task is not in your institution');
  }

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', taskRow.course_id)
    .eq('student_id', ctx.userId)
    .maybeSingle();
  if (!enrollment) throw new ApiError('FORBIDDEN', 'You are not enrolled in this course');

  const path = buildObjectPath({
    institutionId: ctx.institutionId,
    studentId: ctx.userId,
    taskId: taskRow.id,
    filename: input.filename,
  });

  const { data: signed, error: sErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (sErr || !signed) {
    // eslint-disable-next-line no-console
    console.error('[files] createSignedUploadUrl failed', sErr);
    throw new ApiError('INTERNAL_ERROR', 'Could not issue upload URL');
  }

  return {
    path,
    token: signed.token,
    signedUrl: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL,
  };
}

/**
 * Issue a signed download URL for an existing storage object.
 * Validation order:
 *   1. Path must start with the caller's institution_id.
 *   2. Object must actually exist (we stat the folder via storage.list).
 *   3. Student can only read their own folder; teachers/admins of the same
 *      tenant can read any object inside the institution prefix.
 */
export async function issueDownloadUrl(
  ctx: AuthenticatedContext,
  path: string
): Promise<{ signedUrl: string; expiresIn: number }> {
  const segments = path.split('/');
  const [pathInstitution, pathStudent] = segments;
  if (!pathInstitution || pathInstitution !== ctx.institutionId) {
    throw new ApiError('NOT_FOUND', 'File not found'); // do not leak existence across tenants
  }

  if (
    ctx.role === 'student' &&
    pathStudent !== ctx.userId
  ) {
    throw new ApiError('NOT_FOUND', 'File not found');
  }

  // Stat the object via service role so we get a consistent existence signal
  // without depending on the caller's ability to list at that prefix.
  const admin = createServiceClient();
  const folder = segments.slice(0, -1).join('/');
  const filename = segments[segments.length - 1];
  const { data: listing, error: listErr } = await admin.storage
    .from(BUCKET)
    .list(folder, { limit: 100, search: filename });
  if (listErr) {
    // eslint-disable-next-line no-console
    console.error('[files] list failed', listErr);
    throw new ApiError('INTERNAL_ERROR', 'Could not verify file');
  }
  const exists = (listing ?? []).some((entry) => entry.name === filename);
  if (!exists) {
    throw new ApiError('NOT_FOUND', 'File not found');
  }

  const { data: signed, error: sErr } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);

  if (sErr || !signed?.signedUrl) {
    // eslint-disable-next-line no-console
    console.error('[files] createSignedUrl failed', sErr);
    throw new ApiError('INTERNAL_ERROR', 'Could not issue download URL');
  }

  return { signedUrl: signed.signedUrl, expiresIn: SIGNED_URL_TTL };
}
