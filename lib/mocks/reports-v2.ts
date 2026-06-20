import type { RoleKey } from '@/lib/types/auth';
import {
  reportDataAudienceForRole,
  type ReportV2DataAudience,
  type ReportV2ListItem,
  type ReportsV2Fixture,
} from '@/lib/types/reports-v2';

const reports = [
  {
    id: 'report-attendance-algebra',
    title: 'Asistencia por curso',
    category: 'attendance',
    courseId: 'course-algebra-10a',
    scopeLabel: 'Álgebra I · 10A',
    period: 'current',
    periodLabel: 'Período actual',
    status: 'available',
    audience: 'course',
    updatedLabel: 'Hoy · 09:15',
    nextAction: 'Revisar tendencias',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'report-performance-english',
    title: 'Rendimiento académico',
    category: 'performance',
    courseId: 'course-english-11b',
    scopeLabel: 'Inglés B2 · 11B',
    period: 'current',
    periodLabel: 'Período actual',
    status: 'review',
    audience: 'section',
    updatedLabel: 'Ayer · 15:30',
    nextAction: 'Validar resumen',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'report-risk-science',
    title: 'Estudiantes en riesgo',
    category: 'risk',
    courseId: 'course-science-6a',
    scopeLabel: 'Ciencias Integradas · 6A',
    period: 'recent',
    periodLabel: 'Últimas cuatro semanas',
    status: 'available',
    audience: 'section',
    updatedLabel: 'Hace 2 días',
    nextAction: 'Coordinar seguimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'report-evaluations-pending',
    title: 'Evaluaciones pendientes',
    category: 'evaluations',
    courseId: 'course-history-9c',
    scopeLabel: 'Historia Contemporánea · 9C',
    period: 'current',
    periodLabel: 'Período actual',
    status: 'scheduled',
    audience: 'course',
    updatedLabel: 'Esta semana',
    nextAction: 'Consultar próxima revisión',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'report-materials-institution',
    title: 'Materiales publicados',
    category: 'materials',
    courseId: null,
    scopeLabel: 'Toda la institución',
    period: 'recent',
    periodLabel: 'Últimos 30 días',
    status: 'available',
    audience: 'institution',
    updatedLabel: 'Hace 3 días',
    nextAction: 'Revisar cobertura',
    audiences: ['institution'],
  },
  {
    id: 'report-activity-institution',
    title: 'Actividad institucional',
    category: 'activity',
    courseId: null,
    scopeLabel: 'Toda la institución',
    period: 'previous',
    periodLabel: 'Período anterior',
    status: 'review',
    audience: 'institution',
    updatedLabel: 'Período anterior',
    nextAction: 'Validar observaciones',
    audiences: ['institution'],
  },
] as const satisfies readonly ReportV2ListItem[];

export const EMPTY_REPORTS_V2: ReportsV2Fixture = {
  summary: {
    availableReports: 0,
    pendingReview: 0,
    academicAlerts: 0,
    lastUpdateLabel: 'Sin actualizaciones',
  },
  reports: [],
  insights: [],
  scheduled: [],
  disclaimer: 'Resumen mock no oficial',
};

export function getMockReportsV2(roleKey: RoleKey): ReportsV2Fixture {
  const audience = reportDataAudienceForRole(roleKey);
  if (!audience) return EMPTY_REPORTS_V2;
  const scopedReports = reports.filter((report) =>
    (report.audiences as readonly ReportV2DataAudience[]).includes(audience)
  );
  return {
    summary: {
      availableReports: scopedReports.filter((report) => report.status === 'available')
        .length,
      pendingReview: scopedReports.filter((report) => report.status === 'review').length,
      academicAlerts: scopedReports.filter((report) => report.category === 'risk').length,
      lastUpdateLabel: scopedReports[0]?.updatedLabel ?? 'Sin actualizaciones',
    },
    reports: scopedReports,
    insights: [
      {
        id: 'insight-attendance',
        title: 'Asistencia estable',
        detail: 'La mayoría de cursos mock se mantiene sobre el rango esperado.',
      },
      {
        id: 'insight-review',
        title: 'Revisión académica',
        detail: 'Hay resúmenes de demostración pendientes de validación humana.',
      },
      {
        id: 'insight-materials',
        title: 'Cobertura de materiales',
        detail: 'Los cursos visibles presentan actividad reciente de recursos mock.',
      },
    ],
    scheduled: scopedReports.filter((report) => report.status === 'scheduled'),
    disclaimer: 'Insights y reportes mock de demostración · no oficiales',
  };
}
