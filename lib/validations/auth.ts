import { z } from 'zod';

export const institutionSignupSchema = z.object({
  institutionName: z.string().trim().min(2).max(120),
  institutionSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and dashes'),
  adminFullName: z.string().trim().min(2).max(120),
  adminEmail: z.string().trim().toLowerCase().email(),
  adminPassword: z.string().min(8).max(72),
});

export type InstitutionSignupInput = z.infer<typeof institutionSignupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const inviteUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  fullName: z.string().trim().min(2).max(120),
  role: z.enum(['student', 'teacher', 'admin']),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
