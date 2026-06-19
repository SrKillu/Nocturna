import type { RoleKey } from '@/lib/types/auth';
import type { GuardianSpaceV2ViewModel } from '@/lib/types/guardian-space-v2';

const guardianSpace = {
  periodLabel: 'Ciclo lectivo 2026',
  summary:
    'Consulta el avance general, la asistencia y los seguimientos de los estudiantes asociados.',
  students: [
    {
      id: 'guardian-student-valeria',
      name: 'Valeria Gómez',
      code: 'EST-1042',
      levelLabel: 'Secundaria',
      sectionLabel: '10A',
      academicStatus: 'Progreso estable',
      attendancePercent: 96,
      alertCount: 0,
    },
    {
      id: 'guardian-student-mateo',
      name: 'Mateo Jiménez',
      code: 'EST-1078',
      levelLabel: 'Secundaria',
      sectionLabel: '10A',
      academicStatus: 'Requiere seguimiento',
      attendancePercent: 84,
      alertCount: 2,
    },
  ],
  attendance: [
    {
      studentId: 'guardian-student-valeria',
      studentName: 'Valeria Gómez',
      percent: 96,
      trendLabel: 'Asistencia estable',
    },
    {
      studentId: 'guardian-student-mateo',
      studentName: 'Mateo Jiménez',
      percent: 84,
      trendLabel: 'Requiere observación',
    },
  ],
  evaluations: [
    {
      id: 'guardian-evaluation-valeria',
      studentName: 'Valeria Gómez',
      title: 'Práctica de ecuaciones',
      courseName: 'Álgebra I',
      resultLabel: '88 / 100',
      tone: 'success',
    },
    {
      id: 'guardian-evaluation-mateo',
      studentName: 'Mateo Jiménez',
      title: 'Actividad diagnóstica',
      courseName: 'Álgebra I',
      resultLabel: 'En revisión',
      tone: 'warning',
    },
  ],
  alerts: [
    {
      id: 'guardian-alert-attendance',
      studentName: 'Mateo Jiménez',
      title: 'Asistencia por revisar',
      detail: 'La asistencia del período está por debajo del objetivo de demostración.',
      tone: 'warning',
    },
    {
      id: 'guardian-alert-support',
      studentName: 'Mateo Jiménez',
      title: 'Plan de apoyo sugerido',
      detail: 'Revisar las actividades pendientes durante la próxima semana.',
      tone: 'info',
    },
  ],
  nextActions: [
    {
      id: 'guardian-action-attendance',
      title: 'Revisar resumen de asistencia',
      context: 'Mateo Jiménez',
      dueLabel: 'Esta semana',
      priority: 'high',
    },
    {
      id: 'guardian-action-feedback',
      title: 'Consultar retroalimentación reciente',
      context: 'Valeria Gómez',
      dueLabel: 'Sin vencimiento',
      priority: 'low',
    },
  ],
  communications: [
    {
      id: 'guardian-communication-algebra',
      title: 'Comunicado de Álgebra I',
      detail: 'La próxima semana se realizará una actividad de repaso.',
      dateLabel: 'Ayer',
    },
    {
      id: 'guardian-communication-general',
      title: 'Recordatorio institucional',
      detail: 'Consulta el calendario académico de demostración para próximas fechas.',
      dateLabel: 'Hace 3 días',
    },
  ],
} as const satisfies GuardianSpaceV2ViewModel;

export const EMPTY_GUARDIAN_SPACE_V2 = {
  periodLabel: 'Ciclo lectivo 2026',
  summary: 'No hay estudiantes asociados en esta vista de demostración.',
  students: [],
  attendance: [],
  evaluations: [],
  alerts: [],
  nextActions: [],
  communications: [],
} as const satisfies GuardianSpaceV2ViewModel;

export function getMockGuardianSpaceV2(
  roleKey: RoleKey
): GuardianSpaceV2ViewModel | null {
  return roleKey === 'guardian' ? guardianSpace : null;
}
