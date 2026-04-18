import { z } from 'zod';

export const gradeSubmissionSchema = z.object({
  score: z.number().min(0).max(10000),
  feedback: z.string().trim().max(5000).optional().nullable(),
});
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
