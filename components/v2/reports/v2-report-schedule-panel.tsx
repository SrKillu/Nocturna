import { CalendarClock } from 'lucide-react';
import { V2ReportStatusBadge } from '@/components/v2/reports/v2-report-status-badge';
import type { ReportV2ListItem } from '@/lib/types/reports-v2';

export function V2ReportSchedulePanel({ reports }: { reports: readonly ReportV2ListItem[] }) {
  return <section className="rounded-md border bg-card" aria-labelledby="report-schedule-title"><div className="border-b px-4 py-3"><h2 id="report-schedule-title" className="flex items-center gap-2 font-semibold"><CalendarClock className="h-4 w-4 text-primary" aria-hidden />Reportes programados</h2><p className="mt-0.5 text-sm text-muted-foreground">Agenda mock sin ejecución automática.</p></div>{reports.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No hay reportes programados en este alcance.</p> : <ul className="divide-y">{reports.map((report) => <li key={report.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium">{report.title}</p><p className="text-xs text-muted-foreground">{report.scopeLabel} · {report.periodLabel}</p></div><V2ReportStatusBadge status={report.status} /></li>)}</ul>}</section>;
}
