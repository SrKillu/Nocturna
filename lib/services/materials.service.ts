import 'server-only';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ApiError } from '@/lib/errors';
import type { AuthenticatedContext } from '@/lib/types/auth';

const BUCKET = 'materials';
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

export const createMaterialSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
});
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

export interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface MaterialFileInput {
  name: string;
  mime: string;
  bytes: Uint8Array;
  size: number;
}

async function assertCanManageCourse(
  ctx: AuthenticatedContext,
  courseId: string
): Promise<{ institution_id: string }> {
  const sb = createClient();
  const { data: course, error } = await sb
    .from('courses')
    .select('id, institution_id, teacher_id')
    .eq('id', courseId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  if (!course) throw new ApiError('NOT_FOUND', 'Curso no encontrado');
  const isStaff = ctx.role === 'admin' || ctx.role === 'super_admin';
  const isOwnerTeacher = ctx.role === 'teacher' && course.teacher_id === ctx.userId;
  if (!isStaff && !isOwnerTeacher) {
    throw new ApiError('FORBIDDEN', 'No puedes subir materiales a este curso');
  }
  return { institution_id: course.institution_id };
}

export async function listMaterials(
  _ctx: AuthenticatedContext,
  courseId: string
): Promise<MaterialRow[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from('materials')
    .select('id, title, description, file_name, file_size, mime_type, uploaded_by, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  return (data ?? []) as MaterialRow[];
}

export async function createMaterial(
  ctx: AuthenticatedContext,
  courseId: string,
  input: CreateMaterialInput,
  file: MaterialFileInput
): Promise<MaterialRow> {
  if (!file) throw new ApiError('VALIDATION_ERROR', 'Archivo requerido');
  if (file.size > MAX_BYTES) {
    throw new ApiError('VALIDATION_ERROR', 'Archivo demasiado grande (máx 50 MB)');
  }
  const course = await assertCanManageCourse(ctx, courseId);
  const sb = createClient();

  const safe = sanitize(file.name);
  const uid = crypto.randomUUID();
  const path = `${ctx.institutionId}/${courseId}/${uid}-${safe}`;

  const up = await sb.storage
    .from(BUCKET)
    .upload(path, file.bytes, { contentType: file.mime, upsert: false });
  if (up.error) throw new ApiError('INTERNAL_ERROR', `Upload: ${up.error.message}`);

  const { data: inserted, error } = await sb
    .from('materials')
    .insert({
      institution_id: course.institution_id,
      course_id: courseId,
      title: input.title,
      description: input.description?.trim() || null,
      file_path: path,
      file_name: safe,
      file_size: file.size,
      mime_type: file.mime,
      uploaded_by: ctx.userId,
    })
    .select('id, title, description, file_name, file_size, mime_type, uploaded_by, created_at')
    .single();

  if (error) {
    await sb.storage.from(BUCKET).remove([path]).catch(() => undefined);
    throw new ApiError('INTERNAL_ERROR', error.message);
  }
  return inserted as MaterialRow;
}

export async function getMaterialSignedUrl(
  ctx: AuthenticatedContext,
  materialId: string,
  expiresInSec = 60
): Promise<{ url: string; fileName: string; size: number | null }> {
  const sb = createClient();
  const { data: m, error } = await sb
    .from('materials')
    .select('id, course_id, file_path, file_name, file_size')
    .eq('id', materialId)
    .maybeSingle();
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
  if (!m) throw new ApiError('NOT_FOUND', 'Material no encontrado');
  // RLS already enforced access; mint the signed URL.
  const signed = await sb.storage
    .from(BUCKET)
    .createSignedUrl(m.file_path, expiresInSec, { download: m.file_name });
  if (signed.error || !signed.data?.signedUrl) {
    throw new ApiError('INTERNAL_ERROR', signed.error?.message ?? 'URL error');
  }
  return { url: signed.data.signedUrl, fileName: m.file_name, size: m.file_size };
}

export async function deleteMaterial(
  ctx: AuthenticatedContext,
  materialId: string
): Promise<void> {
  const sb = createClient();
  const { data: m } = await sb
    .from('materials')
    .select('id, course_id, file_path')
    .eq('id', materialId)
    .maybeSingle();
  if (!m) throw new ApiError('NOT_FOUND', 'Material no encontrado');
  await assertCanManageCourse(ctx, m.course_id);
  await sb.storage.from(BUCKET).remove([m.file_path]).catch(() => undefined);
  const { error } = await sb.from('materials').delete().eq('id', materialId);
  if (error) throw new ApiError('INTERNAL_ERROR', error.message);
}

function sanitize(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120);
  return cleaned || 'archivo';
}
