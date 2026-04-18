import { z } from 'zod';

export const submitTaskSchema = z.object({
  content: z.string().trim().min(1).max(20000).optional().nullable(),
  filePath: z.string().trim().max(500).optional().nullable(),
}).refine(
  (v) => (v.content && v.content.length > 0) || (v.filePath && v.filePath.length > 0),
  { message: 'Either content or filePath is required' }
);
export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;
