import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import {
  listCourseGrades,
  upsertFinalGrade,
  upsertFinalGradeSchema,
} from '@/lib/services/final-grades.service';
import { toApiErrorResponse } from '@/lib/errors';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const rows = await listCourseGrades(ctx, params.id);
    return NextResponse.json({ data: rows });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const input = upsertFinalGradeSchema.parse(body);
    const row = await upsertFinalGrade(ctx, params.id, input);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
