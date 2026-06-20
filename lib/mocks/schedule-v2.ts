import type { RoleKey } from '@/lib/types/auth';
import { scheduleAudienceForRole, type ScheduleV2Audience, type ScheduleV2Fixture, type ScheduleV2Session } from '@/lib/types/schedule-v2';

const sessions = [
  { id:'session-mon-algebra', day:'monday', dayLabel:'Lunes', startTime:'08:00', endTime:'09:20', courseId:'course-algebra-10a', courseLabel:'Álgebra I', sectionLabel:'10A', teacherLabel:'Docente demo 02', roomLabel:'Aula 204', status:'scheduled', type:'regular', conflict:'none', audiences:['institution','teacher'] },
  { id:'session-mon-science', day:'monday', dayLabel:'Lunes', startTime:'09:30', endTime:'10:50', courseId:'course-science-6a', courseLabel:'Ciencias Integradas', sectionLabel:'6A', teacherLabel:'Docente demo 02', roomLabel:'Laboratorio 1', status:'scheduled', type:'laboratory', conflict:'teacher', audiences:['institution','teacher'] },
  { id:'session-tue-english', day:'tuesday', dayLabel:'Martes', startTime:'08:00', endTime:'09:20', courseId:'course-english-11b', courseLabel:'Inglés B2', sectionLabel:'11B', teacherLabel:'Docente demo 03', roomLabel:'Aula 108', status:'in_progress', type:'regular', conflict:'none', audiences:['institution','teacher'] },
  { id:'session-wed-history', day:'wednesday', dayLabel:'Miércoles', startTime:'10:00', endTime:'11:20', courseId:'course-history-9c', courseLabel:'Historia Contemporánea', sectionLabel:'9C', teacherLabel:'Docente demo 05', roomLabel:'Aula 204', status:'pending', type:'evaluation', conflict:'room', audiences:['institution'] },
  { id:'session-thu-tutorial', day:'thursday', dayLabel:'Jueves', startTime:'13:00', endTime:'13:50', courseId:'course-algebra-10a', courseLabel:'Álgebra I', sectionLabel:'10A', teacherLabel:'Asistente demo 04', roomLabel:'Sala 3', status:'rescheduled', type:'tutorial', conflict:'capacity', audiences:['institution','teacher'] },
  { id:'session-fri-meeting', day:'friday', dayLabel:'Viernes', startTime:'14:00', endTime:'15:00', courseId:'course-science-6a', courseLabel:'Coordinación de Ciencias', sectionLabel:'Equipo', teacherLabel:'Docente demo 02', roomLabel:'Sala docente', status:'scheduled', type:'meeting', conflict:'none', audiences:['institution'] },
] as const satisfies readonly ScheduleV2Session[];

export const EMPTY_SCHEDULE_V2: ScheduleV2Fixture = { summary:{scheduledSessions:0,occupiedRooms:0,conflicts:0,nextSessionLabel:'Sin sesiones'}, sessions:[], conflicts:[], upcoming:[], disclaimer:'Horario mock no oficial' };
export function getMockScheduleV2(roleKey: RoleKey): ScheduleV2Fixture {
  const audience = scheduleAudienceForRole(roleKey); if (!audience) return EMPTY_SCHEDULE_V2;
  const scoped = sessions.filter((session) => (session.audiences as readonly ScheduleV2Audience[]).includes(audience));
  return { summary:{ scheduledSessions:scoped.filter((s)=>s.status==='scheduled'||s.status==='pending').length, occupiedRooms:new Set(scoped.map((s)=>s.roomLabel)).size, conflicts:scoped.filter((s)=>s.conflict!=='none').length, nextSessionLabel: scoped[0] ? `${scoped[0].dayLabel} · ${scoped[0].startTime}` : 'Sin sesiones' }, sessions:scoped, conflicts: scoped.filter((s)=>s.conflict!=='none').map((s)=>({id:`conflict-${s.id}`,title:s.conflict==='room'?'Choque de aula':s.conflict==='teacher'?'Choque de docente':'Revisión de cupo',detail:`${s.courseLabel} · ${s.dayLabel} ${s.startTime}`,type:s.conflict as 'room'|'teacher'|'capacity'})), upcoming:scoped.slice(0,3), disclaimer:'Horario, aulas y conflictos mock · sin calendario oficial' };
}
