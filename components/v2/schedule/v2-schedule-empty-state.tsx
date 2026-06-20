import { CalendarDays } from 'lucide-react'; import { V2EmptyState } from '@/components/v2/states/v2-empty-state';
export function V2ScheduleEmptyState({filtered}:{filtered:boolean}){return <V2EmptyState icon={CalendarDays} title={filtered?'No encontramos sesiones':'Aún no hay sesiones mock'} description={filtered?'Ajusta los filtros.':'El horario de demostración aparecerá aquí.'}/>}
