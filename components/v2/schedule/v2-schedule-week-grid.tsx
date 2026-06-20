import { V2ScheduleDayColumn } from './v2-schedule-day-column'; import { groupScheduleByDay, type ScheduleV2Session } from '@/lib/types/schedule-v2';
const days=[['monday','Lunes'],['tuesday','Martes'],['wednesday','Miércoles'],['thursday','Jueves'],['friday','Viernes']] as const;
export function V2ScheduleWeekGrid({sessions}:{sessions:readonly ScheduleV2Session[]}){const groups=groupScheduleByDay(sessions);return <div className="hidden grid-cols-5 gap-3 lg:grid">{days.map(([day,label])=><V2ScheduleDayColumn key={day} label={label} sessions={groups[day]}/>)}</div>}
