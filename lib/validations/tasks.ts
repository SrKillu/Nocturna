import { z } from 'zod';

export const createTaskSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  maxScore: z.number().int().min(1).max(1000).default(100),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = createTaskSchema.partial();
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
