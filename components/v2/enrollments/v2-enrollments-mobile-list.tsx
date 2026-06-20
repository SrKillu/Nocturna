import { BookOpenCheck, CalendarDays } from 'lucide-react';
import { V2EnrollmentRiskBadge } from '@/components/v2/enrollments/v2-enrollment-risk-badge';
import { V2EnrollmentStatusBadge } from '@/components/v2/enrollments/v2-enrollment-status-badge';
import { V2EnrollmentTypeBadge } from '@/components/v2/enrollments/v2-enrollment-type-badge';
import type { EnrollmentV2ListItem } from '@/lib/types/enrollments-v2';

export function V2EnrollmentsMobileList({ enrollments }: { enrollments: readonly EnrollmentV2ListItem[] }) {
  return <ul className="divide-y overflow-hidden rounded-md border bg-card xl:hidden">{enrollments.map((item) => <li key={item.id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.studentLabel}</p><p className="font-mono text-xs text-muted-foreground">{item.studentCode}</p></div><V2EnrollmentStatusBadge status={item.status} /></div><div className="flex flex-wrap gap-2"><V2EnrollmentTypeBadge type={item.type} /><V2EnrollmentRiskBadge risk={item.risk} /></div><div className="grid gap-2 text-sm sm:grid-cols-2"><p className="flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-muted-foreground" aria-hidden />{item.courseLabel} · {item.sectionLabel}</p><p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />{item.periodLabel}</p></div><div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>Cupo {item.capacityLabel}</span><span>{item.nextAction}</span></div></li>)}</ul>;
}
