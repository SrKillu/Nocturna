'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { V2EnrollmentsCapacityPanel } from '@/components/v2/enrollments/v2-enrollments-capacity-panel';
import { V2EnrollmentsChangesPanel } from '@/components/v2/enrollments/v2-enrollments-changes-panel';
import { V2EnrollmentsEmptyState } from '@/components/v2/enrollments/v2-enrollments-empty-state';
import { V2EnrollmentsFilters } from '@/components/v2/enrollments/v2-enrollments-filters';
import { V2EnrollmentsHeader } from '@/components/v2/enrollments/v2-enrollments-header';
import { V2EnrollmentsMobileList } from '@/components/v2/enrollments/v2-enrollments-mobile-list';
import { V2EnrollmentsSummary } from '@/components/v2/enrollments/v2-enrollments-summary';
import { V2EnrollmentsTable } from '@/components/v2/enrollments/v2-enrollments-table';
import { filterEnrollmentsV2, type EnrollmentV2FilterState, type EnrollmentsV2Fixture } from '@/lib/types/enrollments-v2';

const initialFilters: EnrollmentV2FilterState = { query: '', courseId: 'all', section: 'all', status: 'all', period: 'all', type: 'all', risk: 'all' };

export function V2EnrollmentsPage({ enrollments }: { enrollments: EnrollmentsV2Fixture }) {
  const [filters, setFilters] = useState(initialFilters);
  const filtered = useMemo(() => filterEnrollmentsV2(enrollments.enrollments, filters), [enrollments.enrollments, filters]);
  const courseOptions = useMemo(() => { const values = new Map<string, string>(); enrollments.enrollments.forEach((item) => values.set(item.courseId, item.courseLabel)); return Array.from(values, ([courseId, courseLabel]) => ({ courseId, courseLabel })); }, [enrollments.enrollments]);
  const sectionOptions = useMemo(() => Array.from(new Set(enrollments.enrollments.map((item) => item.sectionLabel))), [enrollments.enrollments]);
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key as keyof EnrollmentV2FilterState]);
  return <div className="space-y-5"><V2EnrollmentsHeader /><V2EnrollmentsSummary summary={enrollments.summary} /><V2EnrollmentsFilters filters={filters} courseOptions={courseOptions} sectionOptions={sectionOptions} onChange={setFilters} /><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><p className="text-muted-foreground"><span className="font-medium text-foreground">{filtered.length}</span> {filtered.length === 1 ? 'matrícula visible' : 'matrículas visibles'}</p><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="h-4 w-4" aria-hidden />{enrollments.disclaimer}</span></div>{filtered.length === 0 ? <div className="rounded-md border bg-card p-4"><V2EnrollmentsEmptyState filtered={hasFilters} /></div> : <><V2EnrollmentsTable enrollments={filtered} /><V2EnrollmentsMobileList enrollments={filtered} /></>}<div className="grid gap-5 lg:grid-cols-2"><V2EnrollmentsCapacityPanel capacity={enrollments.capacity} /><V2EnrollmentsChangesPanel changes={enrollments.changes} /></div></div>;
}
