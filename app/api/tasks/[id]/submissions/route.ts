import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { submitTaskSchema } from '@/lib/validations/submissions';
import {
  submitTask,
  listSubmissionsForTask,
  getMySubmissionForTask,
} from '@/lib/services/submissions.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const input = submitTaskSchema.parse(body);
    const submission = await submitTask(ctx, params.id, input);
    return NextResponse.json({ data: submission }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    if (ctx.role === 'student') {
      const mine = await getMySubmissionForTask(ctx, params.id);
      return NextResponse.json({ data: mine });
    }
    const subs = await listSubmissionsForTask(ctx, params.id);
    return NextResponse.json({ data: subs });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
