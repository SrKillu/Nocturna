import { z } from 'zod';

// Existing schemas (bootstrap de institución + login) siguen intactos; únicamente
// añadimos el nuevo `publicRegisterSchema` para el endpoint /api/auth/register.
export const institutionSignupSchema = z.object({
  institutionName: z.string().trim().min(2, 'Nombre demasiado corto').max(200),
  institutionSlug: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  adminFullName: z.string().trim().min(2).max(200),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});
export type InstitutionSignupInput = z.infer<typeof institutionSignupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const inviteUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(2).max(200),
  role: z.enum(['admin', 'teacher', 'student']),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

/**
 * Registro público (no-admin). Valida tanto el flujo "libre" como el de
 * invitación por token:
 *   - sin token: el role es elegido por el usuario (student o teacher) y la
 *     cuenta queda sin institución asignada (is_active=true, institution_id=null).
 *     La UI la envía a /auth/pending para pegar código cuando lo reciba.
 *   - con token: role + institution_id se heredan del invite y se consume
 *     atomicamente al crear la cuenta.
 */
export const publicRegisterSchema = z.object({
  fullName: z.string().trim().min(2, 'Nombre demasiado corto').max(200),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['student', 'teacher']).default('student'),
  token: z.string().uuid().optional().nullable(),
});
export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>;
