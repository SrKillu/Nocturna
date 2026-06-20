'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';

import { V2GradebookDistributionPanel } from '@/components/v2/gradebook/v2-gradebook-distribution-panel';
import { V2GradebookEmptyState } from '@/components/v2/gradebook/v2-gradebook-empty-state';
import { V2GradebookFilters } from '@/components/v2/gradebook/v2-gradebook-filters';
import { V2GradebookHeader } from '@/components/v2/gradebook/v2-gradebook-header';
import { V2GradebookMobileList } from '@/components/v2/gradebook/v2-gradebook-mobile-list';
import { V2GradebookRiskPanel } from '@/components/v2/gradebook/v2-gradebook-risk-panel';
import { V2GradebookSummary } from '@/components/v2/gradebook/v2-gradebook-summary';
import { V2GradebookTable } from '@/components/v2/gradebook/v2-gradebook-table';
import {
  filterGradebookV2,
  type GradebookV2FilterState,
  type GradebookV2Fixture,
} from '@/lib/types/gradebook-v2';

const initialFilters: GradebookV2FilterState = {
  query: '',
  courseId: 'all',
  section: 'all',
  period: 'all',
  status: 'all',
  range: 'all',
};

export function V2GradebookPage({
  gradebook,
}: {
  gradebook: GradebookV2Fixture;
}) {
  const [filters, setFilters] = useState<GradebookV2FilterState>(initialFilters);
  const filteredRecords = useMemo(
    () => filterGradebookV2(gradebook.records, filters),
    [gradebook.records, filters]
  );
  const courseOptions = useMemo(() => {
    const courses = new Map<string, string>();
    gradebook.records.forEach((record) =>
      courses.set(record.courseId, record.courseName)
    );
    return Array.from(courses, ([courseId, courseName]) => ({
      courseId,
      courseName,
    }));
  }, [gradebook.records]);
  const sectionOptions = useMemo(
    () => Array.from(new Set(gradebook.records.map((record) => record.sectionLabel))),
    [gradebook.records]
  );
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key as keyof GradebookV2FilterState]
  );

  return (
    <div className="space-y-5">
      <V2GradebookHeader />
      <V2GradebookSummary summary={gradebook.summary} />
      <V2GradebookFilters
        filters={filters}
        courseOptions={courseOptions}
        sectionOptions={sectionOptions}
        onChange={setFilters}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{filteredRecords.length}</span>{' '}
          {filteredRecords.length === 1 ? 'registro visible' : 'registros visibles'}
        </p>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-4 w-4" aria-hidden />
          {gradebook.calculationLabel}
        </span>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="rounded-md border bg-card p-4">
          <V2GradebookEmptyState filtered={hasFilters} />
        </div>
      ) : (
        <>
          <V2GradebookTable records={filteredRecords} />
          <V2GradebookMobileList records={filteredRecords} />
        </>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <V2GradebookDistributionPanel distribution={gradebook.distribution} />
        <V2GradebookRiskPanel records={gradebook.riskRecords} />
      </div>
    </div>
  );
}
