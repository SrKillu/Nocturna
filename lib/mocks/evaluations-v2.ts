import type { RoleKey } from '@/lib/types/auth';
import {
  evaluationAudienceForRole,
  type EvaluationV2Audience,
  type EvaluationV2ListItem,
  type EvaluationsV2Fixture,
} from '@/lib/types/evaluations-v2';

const evaluations = [
  {
    id: 'evaluation-algebra-equations',
    title: 'Ecuaciones lineales',
    courseId: 'course-algebra-10a',
    courseName: 'Álgebra I',
    sectionLabel: '10A',
    type: 'quiz',
    deadlineLabel: 'Hoy · 18:00',
    deadlineWindow: 'today',
    submittedCount: 24,
    expectedCount: 28,
    pendingReviewCount: 8,
    status: 'review',
    averageGrade: 86,
    period: 'current',
    nextAction: 'Revisar entregas pendientes',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'evaluation-english-presentation',
    title: 'Presentación oral B2',
    courseId: 'course-english-11b',
    courseName: 'Inglés B2',
    sectionLabel: '11B',
    type: 'project',
    deadlineLabel: 'Viernes · 10:20',
    deadlineWindow: 'this_week',
    submittedCount: 18,
    expectedCount: 24,
    pendingReviewCount: 6,
    status: 'active',
    averageGrade: 91,
    period: 'current',
    nextAction: 'Preparar retroalimentación',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'evaluation-science-observation',
    title: 'Bitácora de observación',
    courseId: 'course-science-6a',
    courseName: 'Ciencias Integradas',
    sectionLabel: '6A',
    type: 'assignment',
    deadlineLabel: 'Lunes · 07:10',
    deadlineWindow: 'next_week',
    submittedCount: 11,
    expectedCount: 31,
    pendingReviewCount: 0,
    status: 'active',
    averageGrade: null,
    period: 'upcoming',
    nextAction: 'Confirmar criterios',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'evaluation-history-diagnostic',
    title: 'Diagnóstico de unidad',
    courseId: 'course-history-9c',
    courseName: 'Historia Contemporánea',
    sectionLabel: '9C',
    type: 'exam',
    deadlineLabel: 'Próxima semana',
    deadlineWindow: 'next_week',
    submittedCount: 0,
    expectedCount: 26,
    pendingReviewCount: 0,
    status: 'draft',
    averageGrade: null,
    period: 'upcoming',
    nextAction: 'Revisar borrador',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'evaluation-technology-prototype',
    title: 'Prototipo funcional',
    courseId: 'course-technology-8a',
    courseName: 'Tecnología Aplicada',
    sectionLabel: '8A',
    type: 'project',
    deadlineLabel: 'Hace 3 días',
    deadlineWindow: 'today',
    submittedCount: 20,
    expectedCount: 22,
    pendingReviewCount: 2,
    status: 'review',
    averageGrade: 88,
    period: 'current',
    nextAction: 'Cerrar revisión',
    audiences: ['institution'],
  },
  {
    id: 'evaluation-reading-portfolio',
    title: 'Portafolio de cierre',
    courseId: 'course-reading-5b',
    courseName: 'Lectura y Escritura',
    sectionLabel: '5B',
    type: 'assignment',
    deadlineLabel: 'Período anterior',
    deadlineWindow: 'this_week',
    submittedCount: 29,
    expectedCount: 29,
    pendingReviewCount: 0,
    status: 'completed',
    averageGrade: 93,
    period: 'previous',
    nextAction: 'Consultar resultados',
    audiences: ['institution'],
  },
] as const satisfies readonly EvaluationV2ListItem[];

export const EMPTY_EVALUATIONS_V2: EvaluationsV2Fixture = {
  summary: {
    activeEvaluations: 0,
    pendingReviews: 0,
    upcomingDeadlines: 0,
    averageGrade: null,
  },
  evaluations: [],
  deadlines: [],
};

export function getMockEvaluationsV2(roleKey: RoleKey): EvaluationsV2Fixture {
  const audience = evaluationAudienceForRole(roleKey);
  if (!audience) return EMPTY_EVALUATIONS_V2;

  const scopedEvaluations = evaluations.filter((evaluation) =>
    (evaluation.audiences as readonly EvaluationV2Audience[]).includes(audience)
  );
  const graded = scopedEvaluations.filter(
    (evaluation): evaluation is typeof evaluation & { averageGrade: number } =>
      evaluation.averageGrade !== null
  );
  const averageGrade =
    graded.length === 0
      ? null
      : Math.round(
          graded.reduce((total, evaluation) => total + evaluation.averageGrade, 0) /
            graded.length
        );

  return {
    summary: {
      activeEvaluations: scopedEvaluations.filter(
        (evaluation) =>
          evaluation.status === 'active' || evaluation.status === 'review'
      ).length,
      pendingReviews: scopedEvaluations.reduce(
        (total, evaluation) => total + evaluation.pendingReviewCount,
        0
      ),
      upcomingDeadlines: scopedEvaluations.filter(
        (evaluation) => evaluation.period !== 'previous'
      ).length,
      averageGrade,
    },
    evaluations: scopedEvaluations,
    deadlines: scopedEvaluations
      .filter((evaluation) => evaluation.period !== 'previous')
      .slice(0, 4),
  };
}
