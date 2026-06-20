import type { RoleKey } from '@/lib/types/auth';
import type {
  EnrollmentV2ListItem,
  EnrollmentsV2Fixture,
} from '@/lib/types/enrollments-v2';

const enrollments = [
  {
    id: 'enrollment-demo-1042-algebra',
    studentLabel: 'Estudiante demo 1042',
    studentCode: 'EST-1042',
    courseId: 'course-algebra-10a',
    courseLabel: 'Álgebra I',
    sectionLabel: '10A',
    period: 'current',
    periodLabel: 'Ciclo lectivo 2026',
    status: 'active',
    type: 'regular',
    capacityLabel: '28 de 32',
    risk: 'on_track',
    riskLabel: 'Asignación estable',
    nextAction: 'Mantener seguimiento',
  },
  {
    id: 'enrollment-demo-1078-algebra',
    studentLabel: 'Estudiante demo 1078',
    studentCode: 'EST-1078',
    courseId: 'course-algebra-10a',
    courseLabel: 'Álgebra I',
    sectionLabel: '10A',
    period: 'current',
    periodLabel: 'Ciclo lectivo 2026',
    status: 'review',
    type: 'returning',
    capacityLabel: '28 de 32',
    risk: 'watch',
    riskLabel: 'Revisar continuidad',
    nextAction: 'Validar asignación mock',
  },
  {
    id: 'enrollment-demo-1126-english',
    studentLabel: 'Estudiante demo 1126',
    studentCode: 'EST-1126',
    courseId: 'course-english-11b',
    courseLabel: 'Inglés B2',
    sectionLabel: '11B',
    period: 'current',
    periodLabel: 'Ciclo lectivo 2026',
    status: 'pending',
    type: 'transfer',
    capacityLabel: '24 de 28',
    risk: 'watch',
    riskLabel: 'Cambio pendiente',
    nextAction: 'Revisar documentación mock',
  },
  {
    id: 'enrollment-demo-1184-science',
    studentLabel: 'Estudiante demo 1184',
    studentCode: 'EST-1184',
    courseId: 'course-science-6a',
    courseLabel: 'Ciencias Integradas',
    sectionLabel: '6A',
    period: 'current',
    periodLabel: 'Ciclo lectivo 2026',
    status: 'suspended',
    type: 'agreement',
    capacityLabel: '31 de 34',
    risk: 'priority',
    riskLabel: 'Seguimiento prioritario',
    nextAction: 'Revisar estado académico mock',
  },
  {
    id: 'enrollment-demo-1215-science',
    studentLabel: 'Estudiante demo 1215',
    studentCode: 'EST-1215',
    courseId: 'course-science-6a',
    courseLabel: 'Ciencias Integradas',
    sectionLabel: '6A',
    period: 'current',
    periodLabel: 'Ciclo lectivo 2026',
    status: 'active',
    type: 'regular',
    capacityLabel: '31 de 34',
    risk: 'on_track',
    riskLabel: 'Asignación estable',
    nextAction: 'Mantener seguimiento',
  },
  {
    id: 'enrollment-demo-1303-reading',
    studentLabel: 'Estudiante demo 1303',
    studentCode: 'EST-1303',
    courseId: 'course-reading-5b',
    courseLabel: 'Lectura y Escritura',
    sectionLabel: '5B',
    period: 'previous',
    periodLabel: 'Período anterior',
    status: 'completed',
    type: 'extraordinary',
    capacityLabel: '29 de 30',
    risk: 'on_track',
    riskLabel: 'Cierre completo',
    nextAction: 'Consultar cierre mock',
  },
] as const satisfies readonly EnrollmentV2ListItem[];

export const EMPTY_ENROLLMENTS_V2: EnrollmentsV2Fixture = {
  summary: {
    activeEnrollments: 0,
    pendingChanges: 0,
    availableSeats: 0,
    assignmentAlerts: 0,
  },
  enrollments: [],
  capacity: [],
  changes: [],
  disclaimer: 'Consola mock sin acciones de matrícula',
};

export function getMockEnrollmentsV2(roleKey: RoleKey): EnrollmentsV2Fixture {
  if (roleKey !== 'owner' && roleKey !== 'admin') return EMPTY_ENROLLMENTS_V2;
  return {
    summary: {
      activeEnrollments: enrollments.filter((item) => item.status === 'active')
        .length,
      pendingChanges: enrollments.filter(
        (item) => item.status === 'pending' || item.status === 'review'
      ).length,
      availableSeats: 11,
      assignmentAlerts: enrollments.filter((item) => item.risk !== 'on_track')
        .length,
    },
    enrollments,
    capacity: [
      {
        id: 'capacity-algebra-10a',
        courseLabel: 'Álgebra I',
        sectionLabel: '10A',
        occupied: 28,
        capacity: 32,
      },
      {
        id: 'capacity-english-11b',
        courseLabel: 'Inglés B2',
        sectionLabel: '11B',
        occupied: 24,
        capacity: 28,
      },
      {
        id: 'capacity-science-6a',
        courseLabel: 'Ciencias Integradas',
        sectionLabel: '6A',
        occupied: 31,
        capacity: 34,
      },
    ],
    changes: [
      {
        id: 'change-transfer-1126',
        title: 'Traslado pendiente mock',
        detail: 'Inglés B2 · 11B',
        dateLabel: 'Hoy',
        statusLabel: 'En revisión',
      },
      {
        id: 'change-returning-1078',
        title: 'Reingreso en revisión mock',
        detail: 'Álgebra I · 10A',
        dateLabel: 'Ayer',
        statusLabel: 'Pendiente',
      },
    ],
    disclaimer:
      'Matrículas, cupos y cambios mock · sin persistencia ni acciones reales',
  };
}
