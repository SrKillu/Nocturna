import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).optional().nullable(),
  teacherId: z.string().uuid().optional().nullable(),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = createCourseSchema.partial();
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const assignTeacherSchema = z.object({
  teacherId: z.string().uuid(),
});
export type AssignTeacherInput = z.infer<typeof assignTeacherSchema>;

export const enrollStudentSchema = z.object({
  // Optional: admin can enroll another student; students enroll themselves.
  studentId: z.string().uuid().optional(),
});
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
