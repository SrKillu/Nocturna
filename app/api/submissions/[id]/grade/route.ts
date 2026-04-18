import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { gradeSubmissionSchema } from '@/lib/validations/grades';
import { gradeSubmission } from '@/lib/services/grades.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const input = gradeSubmissionSchema.parse(body);
    // gradeSubmission delegates to the transactional RPC grade_submission.
    const grade = await gradeSubmission(ctx, params.id, input);
    return NextResponse.json({ data: grade }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
