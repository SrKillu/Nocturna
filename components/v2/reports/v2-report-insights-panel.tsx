import { Lightbulb } from 'lucide-react';
import type { ReportV2Insight } from '@/lib/types/reports-v2';

export function V2ReportInsightsPanel({ insights }: { insights: readonly ReportV2Insight[] }) {
  return <section className="rounded-md border bg-card" aria-labelledby="report-insights-title"><div className="border-b px-4 py-3"><h2 id="report-insights-title" className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-primary" aria-hidden />Insights mock</h2><p className="mt-0.5 text-sm text-muted-foreground">Lecturas ilustrativas, no analytics reales.</p></div><ul className="divide-y">{insights.map((insight) => <li key={insight.id} className="px-4 py-3"><p className="text-sm font-medium">{insight.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{insight.detail}</p></li>)}</ul></section>;
}
