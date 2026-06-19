import type { RoleKey } from '@/lib/types/auth';
import type { MySpaceV2ViewModel } from '@/lib/types/my-space-v2';

const studentMySpace = {
  studentCode: 'EST-DEMO-01',
  periodLabel: 'Ciclo lectivo 2026',
  summary:
    'Tu avance es estable. Mantén al día las próximas entregas y revisa la retroalimentación reciente.',
  courses: [
    {
      id: 'course-algebra-10a',
      name: 'Álgebra I',
      code: 'MAT-10A',
      teacherName: 'María Solís',
      scheduleLabel: 'Lunes y miércoles · 08:00',
      progressLabel: 'Progreso estable',
    },
    {
      id: 'course-english-11b',
      name: 'Inglés B2',
      code: 'ING-11B',
      teacherName: 'Daniel Rojas',
      scheduleLabel: 'Martes y jueves · 10:00',
      progressLabel: 'Buen avance',
    },
    {
      id: 'course-reading-5b',
      name: 'Lectura y Escritura',
      code: 'ESP-05B',
      teacherName: 'Lucía Herrera',
      scheduleLabel: 'Viernes · 09:00',
      progressLabel: 'Curso finalizado',
    },
  ],
  nextActions: [
    {
      id: 'my-action-algebra-3',
      title: 'Completar Tarea 3',
      courseName: 'Álgebra I',
      dueLabel: 'Hoy',
      priority: 'high',
    },
    {
      id: 'my-action-english-essay',
      title: 'Revisar ensayo corto',
      courseName: 'Inglés B2',
      dueLabel: 'Lunes',
      priority: 'medium',
    },
    {
      id: 'my-action-reading-feedback',
      title: 'Consultar retroalimentación final',
      courseName: 'Lectura y Escritura',
      dueLabel: 'Esta semana',
      priority: 'low',
    },
  ],
  attendance: {
    percent: 94,
    presentCount: 43,
    lateCount: 2,
    absentCount: 3,
    trendLabel: 'Asistencia estable durante el período actual.',
  },
  evaluations: [
    {
      id: 'my-evaluation-algebra',
      title: 'Práctica de ecuaciones',
      courseName: 'Álgebra I',
      resultLabel: '88 / 100',
      tone: 'success',
    },
    {
      id: 'my-evaluation-english',
      title: 'Comprensión auditiva',
      courseName: 'Inglés B2',
      resultLabel: '84 / 100',
      tone: 'info',
    },
    {
      id: 'my-evaluation-reading',
      title: 'Proyecto de cierre',
      courseName: 'Lectura y Escritura',
      resultLabel: 'Revisado',
      tone: 'neutral',
    },
  ],
  feedback: [
    {
      id: 'my-feedback-english',
      courseName: 'Inglés B2',
      comment: 'Buen avance en estructura. Revisa conectores antes de la próxima entrega.',
      dateLabel: 'Ayer',
    },
    {
      id: 'my-feedback-algebra',
      courseName: 'Álgebra I',
      comment: 'El procedimiento es correcto; documenta con más detalle el último paso.',
      dateLabel: 'Hace 3 días',
    },
  ],
} as const satisfies MySpaceV2ViewModel;

export function getMockMySpaceV2(roleKey: RoleKey): MySpaceV2ViewModel | null {
  return roleKey === 'student' ? studentMySpace : null;
}
