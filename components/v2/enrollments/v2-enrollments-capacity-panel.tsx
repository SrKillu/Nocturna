import { UsersRound } from 'lucide-react';
import type { EnrollmentV2CapacityItem } from '@/lib/types/enrollments-v2';

export function V2EnrollmentsCapacityPanel({ capacity }: { capacity: readonly EnrollmentV2CapacityItem[] }) {
  return <section className="rounded-md border bg-card" aria-labelledby="capacity-title"><div className="border-b px-4 py-3"><h2 id="capacity-title" className="flex items-center gap-2 font-semibold"><UsersRound className="h-4 w-4 text-primary" aria-hidden />Capacidad y cupos mock</h2><p className="mt-0.5 text-sm text-muted-foreground">Lectura ilustrativa sin reservas reales.</p></div><ul className="divide-y">{capacity.map((item) => { const percentage = Math.round((item.occupied / item.capacity) * 100); return <li key={item.id} className="px-4 py-3"><div className="flex justify-between gap-3 text-sm"><span className="font-medium">{item.courseLabel} · {item.sectionLabel}</span><span className="text-muted-foreground">{item.occupied}/{item.capacity}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} /></div></li>; })}</ul></section>;
}
