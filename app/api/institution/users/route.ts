import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { inviteUserSchema } from '@/lib/validations/auth';
import { inviteUserToInstitution } from '@/lib/services/auth.service';
import { listInstitutionTeachers } from '@/lib/services/courses.service';
import { recordAudit } from '@/lib/services/audit.service';
import { enforceCombinedRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { toApiErrorResponse, ApiError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    const role = request.nextUrl.searchParams.get('role');
    if (role === 'teacher') {
      const teachers = await listInstitutionTeachers(ctx);
      return NextResponse.json({ data: teachers });
    }
    requireRole(ctx, ['admin', 'super_admin']);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new ApiError('INTERNAL_ERROR', 'Could not list users');
    return NextResponse.json({ data });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin']);

    enforceCombinedRateLimit({
      rule: RATE_LIMITS.adminUserCreate,
      request,
      userId: ctx.userId,
    });

    const body = await request.json();
    const input = inviteUserSchema.parse(body);

    // Early duplicate check: a friendlier 409 than the race-prone unique violation.
    const supabase = createClient();
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', input.email)
      .maybeSingle();
    if (existing) throw new ApiError('CONFLICT', 'Email already registered');

    const result = await inviteUserToInstitution({
      institutionId: ctx.institutionId,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
    });

    void recordAudit(ctx, {
      action: 'user.invite',
      entityType: 'profile',
      entityId: result.userId,
      metadata: { role: input.role, email: input.email },
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
