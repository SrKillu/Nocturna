import type { RoleKey } from '@/lib/types/auth';
import {
  studentAudienceForRole,
  type StudentV2Audience,
  type StudentV2ListItem,
  type StudentV2Profile,
} from '@/lib/types/students-v2';

const students = [
  {
    id: 'student-valeria-gomez',
    name: 'Valeria Gómez',
    code: 'EST-1042',
    courseId: 'course-algebra-10a',
    courseName: 'Álgebra I',
    sectionLabel: '10A',
    level: 'secondary',
    levelLabel: 'Secundaria',
    status: 'active',
    attendancePercent: 96,
    academicSummary: 'Progreso estable',
    risk: 'on_track',
    nextAction: 'Mantener seguimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'student-mateo-jimenez',
    name: 'Mateo Jiménez',
    code: 'EST-1078',
    courseId: 'course-algebra-10a',
    courseName: 'Álgebra I',
    sectionLabel: '10A',
    level: 'secondary',
    levelLabel: 'Secundaria',
    status: 'follow_up',
    attendancePercent: 84,
    academicSummary: 'Requiere refuerzo',
    risk: 'watch',
    nextAction: 'Revisar plan de apoyo',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'student-camila-vargas',
    name: 'Camila Vargas',
    code: 'EST-1126',
    courseId: 'course-english-11b',
    courseName: 'Inglés B2',
    sectionLabel: '11B',
    level: 'secondary',
    levelLabel: 'Secundaria',
    status: 'active',
    attendancePercent: 93,
    academicSummary: 'Desempeño destacado',
    risk: 'on_track',
    nextAction: 'Preparar retroalimentación',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'student-diego-arias',
    name: 'Diego Arias',
    code: 'EST-1184',
    courseId: 'course-science-6a',
    courseName: 'Ciencias Integradas',
    sectionLabel: '6A',
    level: 'primary',
    levelLabel: 'Primaria',
    status: 'follow_up',
    attendancePercent: 76,
    academicSummary: 'Actividades pendientes',
    risk: 'priority',
    nextAction: 'Coordinar seguimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'student-sofia-mendez',
    name: 'Sofía Méndez',
    code: 'EST-1215',
    courseId: 'course-science-6a',
    courseName: 'Ciencias Integradas',
    sectionLabel: '6A',
    level: 'primary',
    levelLabel: 'Primaria',
    status: 'active',
    attendancePercent: 98,
    academicSummary: 'Evidencias completas',
    risk: 'on_track',
    nextAction: 'Registrar reconocimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'student-lucas-quesada',
    name: 'Lucas Quesada',
    code: 'EST-1259',
    courseId: 'course-history-9c',
    courseName: 'Historia Contemporánea',
    sectionLabel: '9C',
    level: 'secondary',
    levelLabel: 'Secundaria',
    status: 'inactive',
    attendancePercent: 68,
    academicSummary: 'Sin actividad reciente',
    risk: 'priority',
    nextAction: 'Validar continuidad',
    audiences: ['institution'],
  },
  {
    id: 'student-emma-salazar',
    name: 'Emma Salazar',
    code: 'EST-1303',
    courseId: 'course-reading-5b',
    courseName: 'Lectura y Escritura',
    sectionLabel: '5B',
    level: 'primary',
    levelLabel: 'Primaria',
    status: 'active',
    attendancePercent: 91,
    academicSummary: 'Curso finalizado',
    risk: 'on_track',
    nextAction: 'Consultar cierre',
    audiences: ['institution'],
  },
  {
    id: 'student-nicolas-rivera',
    name: 'Nicolás Rivera',
    code: 'EST-1347',
    courseId: 'course-technology-8a',
    courseName: 'Tecnología Aplicada',
    sectionLabel: '8A',
    level: 'secondary',
    levelLabel: 'Secundaria',
    status: 'follow_up',
    attendancePercent: 82,
    academicSummary: 'Proyecto por iniciar',
    risk: 'watch',
    nextAction: 'Confirmar recursos',
    audiences: ['institution'],
  },
] as const satisfies readonly StudentV2ListItem[];

export function getMockStudentsV2(roleKey: RoleKey): readonly StudentV2ListItem[] {
  const audience = studentAudienceForRole(roleKey);
  if (!audience) return [];
  return students.filter((student) =>
    (student.audiences as readonly StudentV2Audience[]).includes(audience)
  );
}

const summaryDetails: Record<string, string> = {
  'student-valeria-gomez':
    'Mantiene un ritmo constante, completa las actividades y participa de forma regular.',
  'student-mateo-jimenez':
    'Presenta avances parciales y se beneficia de seguimiento breve en cada sesión.',
  'student-camila-vargas':
    'Muestra dominio sostenido y responde bien a actividades de mayor complejidad.',
  'student-diego-arias':
    'Tiene actividades pendientes y requiere una secuencia de recuperación acompañada.',
  'student-sofia-mendez':
    'Consolida los aprendizajes esperados y mantiene evidencias académicas completas.',
  'student-lucas-quesada':
    'No registra actividad reciente; se recomienda validar su continuidad académica.',
  'student-emma-salazar':
    'Finalizó el curso con evidencias suficientes y seguimiento académico al día.',
  'student-nicolas-rivera':
    'Está próximo a iniciar el proyecto y necesita confirmar disponibilidad de recursos.',
};

const courseCodes: Record<string, string> = {
  'course-algebra-10a': 'MAT-10A',
  'course-english-11b': 'ING-11B',
  'course-science-6a': 'CIE-06A',
  'course-history-9c': 'HIS-09C',
  'course-reading-5b': 'ESP-05B',
  'course-technology-8a': 'TEC-08A',
};

function buildStudentProfile(student: StudentV2ListItem): StudentV2Profile {
  const attendedSessions = Math.round(student.attendancePercent * 0.24);
  const absentCount = Math.max(0, 24 - attendedSessions);
  const lateCount = student.risk === 'on_track' ? 1 : student.risk === 'watch' ? 2 : 3;

  return {
    ...student,
    periodLabel: 'Ciclo lectivo 2026',
    summaryDetail:
      summaryDetails[student.id] ??
      'Seguimiento académico de demostración para la membresía activa.',
    relatedCourses: [
      {
        id: student.courseId,
        name: student.courseName,
        code: courseCodes[student.courseId] ?? 'CURSO-V2',
        sectionLabel: student.sectionLabel,
        progressLabel: student.academicSummary,
      },
    ],
    attendanceSummary: {
      presentCount: Math.max(0, attendedSessions - lateCount),
      lateCount,
      absentCount,
      trendLabel:
        student.attendancePercent >= 90
          ? 'Asistencia estable'
          : student.attendancePercent >= 80
            ? 'Requiere observación'
            : 'Seguimiento prioritario',
    },
    evaluationsPreview: [
      {
        id: `${student.id}-evaluation-1`,
        title: 'Actividad diagnóstica',
        courseName: student.courseName,
        resultLabel: student.risk === 'priority' ? 'Pendiente' : 'Completada',
        statusLabel: student.risk === 'priority' ? 'Requiere revisión' : 'Registrada',
      },
      {
        id: `${student.id}-evaluation-2`,
        title: 'Evidencia de unidad',
        courseName: student.courseName,
        resultLabel: student.academicSummary,
        statusLabel: 'Vista previa',
      },
    ],
    notesPreview: [
      {
        id: `${student.id}-note-1`,
        title: 'Seguimiento académico',
        detail: student.nextAction,
        dateLabel: 'Esta semana',
      },
      {
        id: `${student.id}-note-2`,
        title: 'Observación de progreso',
        detail: 'Registro de demostración sin datos personales sensibles.',
        dateLabel: 'Semana anterior',
      },
    ],
    nextActions: [
      student.nextAction,
      student.risk === 'on_track'
        ? 'Mantener el ritmo de seguimiento'
        : 'Revisar evidencias en la próxima sesión',
    ],
  };
}

export function getMockStudentProfileV2(
  studentId: string,
  roleKey: RoleKey
): StudentV2Profile | null {
  const student = getMockStudentsV2(roleKey).find((item) => item.id === studentId);
  return student ? buildStudentProfile(student) : null;
}
