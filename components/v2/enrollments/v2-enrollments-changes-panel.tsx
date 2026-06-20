import { History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EnrollmentV2ChangeItem } from '@/lib/types/enrollments-v2';

export function V2EnrollmentsChangesPanel({ changes }: { changes: readonly EnrollmentV2ChangeItem[] }) {
  return <section className="rounded-md border bg-card" aria-labelledby="changes-title"><div className="border-b px-4 py-3"><h2 id="changes-title" className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-primary" aria-hidden />Cambios pendientes mock</h2><p className="mt-0.5 text-sm text-muted-foreground">Sin aprobación, rechazo ni persistencia.</p></div><ul className="divide-y">{changes.map((change) => <li key={change.id} className="flex items-start justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium">{change.title}</p><p className="mt-1 text-xs text-muted-foreground">{change.detail} · {change.dateLabel}</p></div><Badge variant="outline">{change.statusLabel}</Badge></li>)}</ul></section>;
}
