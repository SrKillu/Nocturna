import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { getTaskFileSignedUrl } from '@/lib/services/tasks.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * Issues a short-lived signed URL for a task's attachment and either:
 *   * 302-redirects the browser (default, so `<a href>` works transparently), or
 *   * returns JSON with { url, fileName, size } when ?json=1 is set.
 *
 * Authorization is enforced both at the app layer (role + course ownership /
 * enrolment) and by Supabase Storage RLS (task_files_select_access).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const { url, fileName, size } = await getTaskFileSignedUrl(ctx, params.id, 60);
    const asJson = request.nextUrl.searchParams.get('json') === '1';
    if (asJson) {
      return NextResponse.json({ data: { url, fileName, size } });
    }
    return NextResponse.redirect(url, 302);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
