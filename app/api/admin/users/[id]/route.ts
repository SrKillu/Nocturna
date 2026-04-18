import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { updateTenantUser } from '@/lib/services/auth.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

const patchSchema = z
  .object({
    role: z.enum(['student', 'teacher', 'admin']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, {
    message: 'Nothing to update',
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin']);
    const body = await request.json();
    const input = patchSchema.parse(body);

    const result = await updateTenantUser({
      callerInstitutionId: ctx.institutionId,
      callerUserId: ctx.userId,
      targetUserId: params.id,
      role: input.role,
      isActive: input.isActive,
    });
    return NextResponse.json({ data: result });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
