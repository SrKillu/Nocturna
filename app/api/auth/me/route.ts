import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { toApiErrorResponse } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ctx = await requireAuth();
    const supabase = createClient();
    const { data: institution } = await supabase
      .from('institutions')
      .select('id, name, slug')
      .eq('id', ctx.institutionId)
      .single();
    return NextResponse.json({
      data: {
        userId: ctx.userId,
        email: ctx.email,
        role: ctx.role,
        institutionId: ctx.institutionId,
        institution,
      },
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
