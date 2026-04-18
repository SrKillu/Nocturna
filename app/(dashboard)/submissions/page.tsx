import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import {
  listMySubmissions,
  listSubmissionsForReview,
  type SubmissionListItem,
} from '@/lib/services/submissions.service';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyModule } from '@/components/layout/empty-module';
import { SubmissionRow } from '@/components/submissions/submission-row';
import { SubmissionStatusFilter } from '@/components/submissions/submission-status-filter';
import type { SubmissionStatus } from '@/lib/types/database';

export const metadata: Metadata = {
  title: 'Entregas · Nocturna',
};
export const dynamic = 'force-dynamic';

const STATUS_SET: ReadonlySet<SubmissionStatus> = new Set([
  'submitted',
  'graded',
  'late',
  'returned',
]);

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const ctx = await requireAuth();
  const rawStatus = searchParams.status?.trim() ?? '';
  const status = STATUS_SET.has(rawStatus as SubmissionStatus)
    ? (rawStatus as SubmissionStatus)
    : null;

  let items: SubmissionListItem[] = [];
  if (isSupabaseConfigured()) {
    try {
      items =
        ctx.role === 'student'
          ? await listMySubmissions(ctx)
          : await listSubmissionsForReview(ctx, { status });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[submissions] list failed', err);
    }
  }

  const filtered =
    ctx.role === 'student' && status
      ? items.filter((i) => i.status === status)
      : items;

  return (
    <>
      <PageHeader
        title="Entregas"
        description={
          ctx.role === 'student'
            ? 'Historial de tus entregas y su estado.'
            : 'Entregas de tu institución esperando revisión o ya calificadas.'
        }
      />

      <SubmissionStatusFilter selectedStatus={status} />

      {filtered.length === 0 ? (
        <EmptyModule
          title="Sin entregas"
          description={
            ctx.role === 'student'
              ? 'Cuando envíes tareas las verás aquí con su estado actual.'
              : 'Aún no hay entregas que coincidan con este filtro.'
          }
        />
      ) : (
        <section
          aria-label="Listado de entregas"
          className="overflow-hidden rounded-xl border bg-card"
        >
          <ul className="divide-y">
            {filtered.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/tasks/${s.task_id}`}
                  className="block transition-colors hover:bg-muted/50 focus:outline-none focus-visible:bg-muted/60"
                >
                  <SubmissionRow item={s} role={ctx.role} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
