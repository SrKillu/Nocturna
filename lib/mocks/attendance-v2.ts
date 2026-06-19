import type { RoleKey } from '@/lib/types/auth';
import {
  attendanceAudienceForRole,
  type AttendanceV2Audience,
  type AttendanceV2Fixture,
  type AttendanceV2Record,
  type AttendanceV2Session,
} from '@/lib/types/attendance-v2';

const records = [
  {
    id: 'attendance-valeria-algebra',
    studentName: 'Valeria Gómez',
    studentCode: 'EST-1042',
    courseId: 'course-algebra-10a',
    courseName: 'Álgebra I',
    sectionLabel: '10A',
    period: 'today',
    lastSessionLabel: 'Hoy · 08:00',
    status: 'present',
    attendancePercent: 96,
    alert: 'none',
    nextAction: 'Sin seguimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'attendance-mateo-algebra',
    studentName: 'Mateo Jiménez',
    studentCode: 'EST-1078',
    courseId: 'course-algebra-10a',
    courseName: 'Álgebra I',
    sectionLabel: '10A',
    period: 'today',
    lastSessionLabel: 'Hoy · 08:00',
    status: 'late',
    attendancePercent: 84,
    alert: 'watch',
    nextAction: 'Revisar próxima sesión',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'attendance-camila-english',
    studentName: 'Camila Vargas',
    studentCode: 'EST-1126',
    courseId: 'course-english-11b',
    courseName: 'Inglés B2',
    sectionLabel: '11B',
    period: 'week',
    lastSessionLabel: 'Ayer · 10:20',
    status: 'present',
    attendancePercent: 93,
    alert: 'none',
    nextAction: 'Sin seguimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'attendance-diego-science',
    studentName: 'Diego Arias',
    studentCode: 'EST-1184',
    courseId: 'course-science-6a',
    courseName: 'Ciencias Integradas',
    sectionLabel: '6A',
    period: 'week',
    lastSessionLabel: 'Ayer · 07:10',
    status: 'absent',
    attendancePercent: 76,
    alert: 'priority',
    nextAction: 'Coordinar seguimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'attendance-sofia-science',
    studentName: 'Sofía Méndez',
    studentCode: 'EST-1215',
    courseId: 'course-science-6a',
    courseName: 'Ciencias Integradas',
    sectionLabel: '6A',
    period: 'week',
    lastSessionLabel: 'Ayer · 07:10',
    status: 'present',
    attendancePercent: 98,
    alert: 'none',
    nextAction: 'Sin seguimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'attendance-lucas-history',
    studentName: 'Lucas Quesada',
    studentCode: 'EST-1259',
    courseId: 'course-history-9c',
    courseName: 'Historia Contemporánea',
    sectionLabel: '9C',
    period: 'month',
    lastSessionLabel: 'Hace 4 días',
    status: 'pending',
    attendancePercent: 68,
    alert: 'priority',
    nextAction: 'Validar continuidad',
    audiences: ['institution'],
  },
] as const satisfies readonly AttendanceV2Record[];

const sessions = [
  {
    id: 'session-algebra-today',
    courseName: 'Álgebra I',
    sectionLabel: '10A',
    dateLabel: 'Hoy · 08:00',
    status: 'recorded',
    presentCount: 26,
    expectedCount: 28,
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'session-english-today',
    courseName: 'Inglés B2',
    sectionLabel: '11B',
    dateLabel: 'Hoy · 10:20',
    status: 'pending',
    presentCount: 0,
    expectedCount: 24,
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'session-science-yesterday',
    courseName: 'Ciencias Integradas',
    sectionLabel: '6A',
    dateLabel: 'Ayer · 07:10',
    status: 'recorded',
    presentCount: 29,
    expectedCount: 31,
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'session-history-upcoming',
    courseName: 'Historia Contemporánea',
    sectionLabel: '9C',
    dateLabel: 'Próxima sesión',
    status: 'pending',
    presentCount: 0,
    expectedCount: 26,
    audiences: ['institution'],
  },
] as const satisfies readonly AttendanceV2Session[];

export const EMPTY_ATTENDANCE_V2: AttendanceV2Fixture = {
  summary: {
    averagePercent: 0,
    pendingSessions: 0,
    studentsWithAlerts: 0,
    lastRecordedSessionLabel: 'Sin sesiones',
  },
  records: [],
  sessions: [],
};

export function getMockAttendanceV2(roleKey: RoleKey): AttendanceV2Fixture {
  const audience = attendanceAudienceForRole(roleKey);
  if (!audience) return EMPTY_ATTENDANCE_V2;

  const scopedRecords = records.filter((record) =>
    (record.audiences as readonly AttendanceV2Audience[]).includes(audience)
  );
  const scopedSessions = sessions.filter((session) =>
    (session.audiences as readonly AttendanceV2Audience[]).includes(audience)
  );
  const averagePercent =
    scopedRecords.length === 0
      ? 0
      : Math.round(
          scopedRecords.reduce((total, record) => total + record.attendancePercent, 0) /
            scopedRecords.length
        );

  return {
    summary: {
      averagePercent,
      pendingSessions: scopedSessions.filter((session) => session.status === 'pending')
        .length,
      studentsWithAlerts: scopedRecords.filter((record) => record.alert !== 'none').length,
      lastRecordedSessionLabel:
        scopedSessions.find((session) => session.status === 'recorded')?.dateLabel ??
        'Sin sesiones',
    },
    records: scopedRecords,
    sessions: scopedSessions,
  };
}
