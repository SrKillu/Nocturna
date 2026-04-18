import type { Metadata } from 'next';
import { requireAuth } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import {
  listGradesForStudent,
  listGradesForReview,
  type GradeListItem,
} from '@/lib/services/grades.service';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyModule } from '@/components/layout/empty-module';
import { StudentGradesTable } from '@/components/grades/student-grades-table';
import { ReviewGradesTable } from '@/components/grades/review-grades-table';
import { GradeFilter } from '@/components/grades/grade-filter';

export const metadata: Metadata = {
  title: 'Calificaciones · Nocturna',
};
export const dynamic = 'force-dynamic';

export default async function GradesPage({
  searchParams,
}: {
  searchParams: { pending?: string };
}) {
  const ctx = await requireAuth();
  const onlyPending = searchParams.pending === '1';

  let items: GradeListItem[] = [];
  if (isSupabaseConfigured()) {
    try {
      items =
        ctx.role === 'student'
          ? await listGradesForStudent(ctx)
          : await listGradesForReview(ctx, { onlyPending });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[grades] list failed', err);
    }
  }

  const isStudent = ctx.role === 'student';

  return (
    <>
      <PageHeader
        title="Calificaciones"
        description={
          isStudent
            ? 'Tus calificaciones y feedback recibido.'
            : 'Entregas de tu institución y sus calificaciones. Puedes calificar en línea.'
        }
      />

      {!isStudent ? <GradeFilter onlyPending={onlyPending} /> : null}

      {items.length === 0 ? (
        <EmptyModule
          title={
            isStudent
              ? 'Aún no tienes calificaciones'
              : onlyPending
                ? 'Ninguna entrega pendiente'
                : 'Aún no hay entregas en tu institución'
          }
          description={
            isStudent
              ? 'Cuando un profesor califique una de tus entregas aparecerá aquí.'
              : 'Las entregas de tus cursos se mostrarán en esta tabla.'
          }
        />
      ) : isStudent ? (
        <StudentGradesTable items={items} />
      ) : (
        <ReviewGradesTable items={items} />
      )}
    </>
  );
}
