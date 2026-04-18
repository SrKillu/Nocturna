import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/lib/api/auth';
import { inviteUserSchema } from '@/lib/validations/auth';
import { inviteUserToInstitution } from '@/lib/services/auth.service';
import { listInstitutionTeachers } from '@/lib/services/courses.service';
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
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw new ApiError('INTERNAL_ERROR', error.message);
    return NextResponse.json({ data });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    requireRole(ctx, ['admin', 'super_admin']);
    const body = await request.json();
    const input = inviteUserSchema.parse(body);
    const result = await inviteUserToInstitution({
      institutionId: ctx.institutionId,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
