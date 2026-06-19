'use client';

import { useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';

import { V2EvaluationDeadlinesPanel } from '@/components/v2/evaluations/v2-evaluation-deadlines-panel';
import { V2EvaluationEmptyState } from '@/components/v2/evaluations/v2-evaluation-empty-state';
import { V2EvaluationsFilters } from '@/components/v2/evaluations/v2-evaluations-filters';
import { V2EvaluationsHeader } from '@/components/v2/evaluations/v2-evaluations-header';
import { V2EvaluationsMobileList } from '@/components/v2/evaluations/v2-evaluations-mobile-list';
import { V2EvaluationsSummary } from '@/components/v2/evaluations/v2-evaluations-summary';
import { V2EvaluationsTable } from '@/components/v2/evaluations/v2-evaluations-table';
import {
  filterEvaluationsV2,
  type EvaluationV2FilterState,
  type EvaluationsV2Fixture,
} from '@/lib/types/evaluations-v2';

const initialFilters: EvaluationV2FilterState = {
  query: '',
  courseId: 'all',
  section: 'all',
  type: 'all',
  status: 'all',
  period: 'all',
};

export function V2EvaluationsPage({
  evaluations,
}: {
  evaluations: EvaluationsV2Fixture;
}) {
  const [filters, setFilters] = useState<EvaluationV2FilterState>(initialFilters);
  const filteredEvaluations = useMemo(
    () => filterEvaluationsV2(evaluations.evaluations, filters),
    [evaluations.evaluations, filters]
  );
  const courseOptions = useMemo(() => {
    const courses = new Map<string, string>();
    evaluations.evaluations.forEach((evaluation) =>
      courses.set(evaluation.courseId, evaluation.courseName)
    );
    return Array.from(courses, ([courseId, courseName]) => ({
      courseId,
      courseName,
    }));
  }, [evaluations.evaluations]);
  const sectionOptions = useMemo(
    () =>
      Array.from(
        new Set(evaluations.evaluations.map((evaluation) => evaluation.sectionLabel))
      ),
    [evaluations.evaluations]
  );
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key as keyof EvaluationV2FilterState]
  );

  return (
    <div className="space-y-5">
      <V2EvaluationsHeader />
      <V2EvaluationsSummary summary={evaluations.summary} />
      <V2EvaluationsFilters
        filters={filters}
        courseOptions={courseOptions}
        sectionOptions={sectionOptions}
        onChange={setFilters}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{filteredEvaluations.length}</span>{' '}
          {filteredEvaluations.length === 1
            ? 'evaluación visible'
            : 'evaluaciones visibles'}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ClipboardCheck className="h-4 w-4" aria-hidden />
          Datos académicos de demostración
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.5fr)]">
        <div>
          {filteredEvaluations.length === 0 ? (
            <div className="rounded-md border bg-card p-4">
              <V2EvaluationEmptyState filtered={hasFilters} />
            </div>
          ) : (
            <>
              <V2EvaluationsTable evaluations={filteredEvaluations} />
              <V2EvaluationsMobileList evaluations={filteredEvaluations} />
            </>
          )}
        </div>
        {evaluations.deadlines.length === 0 ? (
          <div className="rounded-md border bg-card p-4">
            <V2EvaluationEmptyState filtered={false} />
          </div>
        ) : (
          <V2EvaluationDeadlinesPanel deadlines={evaluations.deadlines} />
        )}
      </div>
    </div>
  );
}
