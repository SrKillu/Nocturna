import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

const logoutSchema = z
  .object({
    scope: z.enum(['local', 'global']).default('local'),
  })
  .default({ scope: 'local' });

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const { scope } = logoutSchema.parse(body);

    const supabase = createClient();
    // signOut with scope:'global' revokes refresh tokens for every device.
    await supabase.auth.signOut({ scope });

    return NextResponse.json({ data: { scope } });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
