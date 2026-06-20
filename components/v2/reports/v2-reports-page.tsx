'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { V2ReportInsightsPanel } from '@/components/v2/reports/v2-report-insights-panel';
import { V2ReportSchedulePanel } from '@/components/v2/reports/v2-report-schedule-panel';
import { V2ReportsEmptyState } from '@/components/v2/reports/v2-reports-empty-state';
import { V2ReportsFilters } from '@/components/v2/reports/v2-reports-filters';
import { V2ReportsHeader } from '@/components/v2/reports/v2-reports-header';
import { V2ReportsMobileList } from '@/components/v2/reports/v2-reports-mobile-list';
import { V2ReportsSummary } from '@/components/v2/reports/v2-reports-summary';
import { V2ReportsTable } from '@/components/v2/reports/v2-reports-table';
import { filterReportsV2, type ReportV2FilterState, type ReportsV2Fixture } from '@/lib/types/reports-v2';

const initialFilters: ReportV2FilterState = { query: '', category: 'all', courseId: 'all', period: 'all', status: 'all', audience: 'all' };

export function V2ReportsPage({ reports }: { reports: ReportsV2Fixture }) {
  const [filters, setFilters] = useState(initialFilters);
  const filtered = useMemo(() => filterReportsV2(reports.reports, filters), [reports.reports, filters]);
  const courseOptions = useMemo(() => {
    const values = new Map<string, string>();
    reports.reports.forEach((report) => { if (report.courseId) values.set(report.courseId, report.scopeLabel); });
    return Array.from(values, ([courseId, scopeLabel]) => ({ courseId, scopeLabel }));
  }, [reports.reports]);
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key as keyof ReportV2FilterState]);
  return <div className="space-y-5"><V2ReportsHeader /><V2ReportsSummary summary={reports.summary} /><V2ReportsFilters filters={filters} courseOptions={courseOptions} onChange={setFilters} /><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><p className="text-muted-foreground"><span className="font-medium text-foreground">{filtered.length}</span> {filtered.length === 1 ? 'reporte visible' : 'reportes visibles'}</p><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="h-4 w-4" aria-hidden />{reports.disclaimer}</span></div>{filtered.length === 0 ? <div className="rounded-md border bg-card p-4"><V2ReportsEmptyState filtered={hasFilters} /></div> : <><V2ReportsTable reports={filtered} /><V2ReportsMobileList reports={filtered} /></>}<div className="grid gap-5 lg:grid-cols-2"><V2ReportInsightsPanel insights={reports.insights} /><V2ReportSchedulePanel reports={reports.scheduled} /></div></div>;
}
