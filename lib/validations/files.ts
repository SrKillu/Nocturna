import { z } from 'zod';

/**
 * Storage buckets allowed by the API. Matches 0010_storage_hardening.sql.
 */
export const FILE_BUCKETS = ['submissions', 'avatars', 'resources'] as const;
export type FileBucket = (typeof FILE_BUCKETS)[number];

/**
 * Narrow MIME whitelist. Keep this list small. Never accept octet-stream.
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/markdown',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'text/markdown': 'md',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB (hardened from 20)

export const uploadRequestSchema = z.object({
  bucket: z.enum(FILE_BUCKETS),
  // Required when bucket === 'submissions', ignored otherwise at the service layer.
  taskId: z.string().uuid().optional(),
  /** Client-provided filename. We NEVER use this value on disk. Only kept for audit. */
  originalName: z.string().trim().min(1).max(200).optional(),
  mimeType: z
    .string()
    .trim()
    .refine((v) => (ALLOWED_MIME_TYPES as readonly string[]).includes(v), {
      message: 'MIME type not allowed',
    }),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
});
export type UploadRequestInput = z.infer<typeof uploadRequestSchema>;

export const confirmUploadSchema = z.object({
  fileId: z.string().uuid(),
});
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

export const downloadQuerySchema = z.object({
  bucket: z.enum(FILE_BUCKETS),
  path: z
    .string()
    .trim()
    .min(3)
    .max(500)
    .regex(/^[a-zA-Z0-9/_.\-]+$/, 'Invalid storage path'),
});
export type DownloadQuery = z.infer<typeof downloadQuerySchema>;
