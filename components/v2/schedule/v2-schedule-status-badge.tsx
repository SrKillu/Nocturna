import { Badge } from '@/components/ui/badge'; import type { ScheduleV2Status } from '@/lib/types/schedule-v2';
const labels:Record<ScheduleV2Status,string>={scheduled:'Programada',in_progress:'En curso',completed:'Finalizada',cancelled:'Cancelada',rescheduled:'Reprogramada',pending:'Pendiente'};
export function V2ScheduleStatusBadge({status}:{status:ScheduleV2Status}){return <Badge variant={status==='in_progress'?'secondary':'outline'}>{labels[status]}</Badge>}
