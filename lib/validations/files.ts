import { z } from 'zod';

/**
 * MIME whitelist for the `submissions` bucket.
 * Keep the list narrow. If you add a type, also audit it server-side.
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

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

/** Safe filename: ASCII + basic punctuation, no path separators. */
const FILENAME_RE = /^[a-zA-Z0-9._\-\s]{1,200}$/;

export const uploadRequestSchema = z.object({
  taskId: z.string().uuid(),
  filename: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(FILENAME_RE, 'Filename contains invalid characters'),
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

export const signedUrlQuerySchema = z.object({
  path: z
    .string()
    .trim()
    .min(3)
    .max(500)
    .regex(/^[a-zA-Z0-9/_.\-]+$/, 'Invalid storage path'),
});
export type SignedUrlQuery = z.infer<typeof signedUrlQuerySchema>;
