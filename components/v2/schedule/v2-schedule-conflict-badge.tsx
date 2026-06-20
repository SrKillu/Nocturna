import { Badge } from '@/components/ui/badge'; import type { ScheduleV2Conflict } from '@/lib/types/schedule-v2';
const labels:Record<Exclude<ScheduleV2Conflict,'none'>,string>={room:'Choque de aula',teacher:'Choque docente',capacity:'Revisar cupo'};
export function V2ScheduleConflictBadge({conflict}:{conflict:ScheduleV2Conflict}){return conflict==='none'?null:<Badge variant="destructive">{labels[conflict]}</Badge>}
