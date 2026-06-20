import { CalendarDays, Layers3 } from 'lucide-react';
import { V2ReportStatusBadge } from '@/components/v2/reports/v2-report-status-badge';
import { V2ReportTypeBadge } from '@/components/v2/reports/v2-report-type-badge';
import type { ReportV2ListItem } from '@/lib/types/reports-v2';

export function V2ReportsMobileList({ reports }: { reports: readonly ReportV2ListItem[] }) {
  return <ul className="divide-y overflow-hidden rounded-md border bg-card lg:hidden">{reports.map((report) => <li key={report.id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{report.title}</p><div className="mt-1"><V2ReportTypeBadge category={report.category} /></div></div><V2ReportStatusBadge status={report.status} /></div><div className="grid gap-2 text-sm sm:grid-cols-2"><p className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-muted-foreground" aria-hidden />{report.scopeLabel}</p><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />{report.periodLabel}</p></div><div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>{report.updatedLabel}</span><span>{report.nextAction}</span></div></li>)}</ul>;
}
