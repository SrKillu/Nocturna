import type { RoleKey } from '@/lib/types/auth';
import {
  gradebookAudienceForRole,
  gradeRangeForRecord,
  type GradebookV2Audience,
  type GradebookV2Fixture,
  type GradebookV2Range,
  type GradebookV2Record,
} from '@/lib/types/gradebook-v2';

const records = [
  {
    id: 'gradebook-valeria-algebra',
    studentName: 'Valeria Gómez',
    studentCode: 'EST-1042',
    courseId: 'course-algebra-10a',
    courseName: 'Álgebra I',
    sectionLabel: '10A',
    averageGrade: 94,
    lastEvaluationLabel: 'Ecuaciones lineales · 96',
    pendingEvaluations: 0,
    status: 'on_track',
    trend: 'up',
    trendLabel: 'Mejora sostenida',
    period: 'current',
    nextAction: 'Mantener seguimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'gradebook-mateo-algebra',
    studentName: 'Mateo Jiménez',
    studentCode: 'EST-1078',
    courseId: 'course-algebra-10a',
    courseName: 'Álgebra I',
    sectionLabel: '10A',
    averageGrade: 68,
    lastEvaluationLabel: 'Ecuaciones lineales · 64',
    pendingEvaluations: 1,
    status: 'risk',
    trend: 'down',
    trendLabel: 'Requiere apoyo',
    period: 'current',
    nextAction: 'Revisar plan de refuerzo',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'gradebook-camila-english',
    studentName: 'Camila Vargas',
    studentCode: 'EST-1126',
    courseId: 'course-english-11b',
    courseName: 'Inglés B2',
    sectionLabel: '11B',
    averageGrade: 91,
    lastEvaluationLabel: 'Presentación oral · 93',
    pendingEvaluations: 0,
    status: 'on_track',
    trend: 'stable',
    trendLabel: 'Desempeño estable',
    period: 'current',
    nextAction: 'Preparar retroalimentación',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'gradebook-diego-science',
    studentName: 'Diego Arias',
    studentCode: 'EST-1184',
    courseId: 'course-science-6a',
    courseName: 'Ciencias Integradas',
    sectionLabel: '6A',
    averageGrade: 72,
    lastEvaluationLabel: 'Actividad diagnóstica · 70',
    pendingEvaluations: 2,
    status: 'watch',
    trend: 'stable',
    trendLabel: 'Observación recomendada',
    period: 'current',
    nextAction: 'Revisar evidencias pendientes',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'gradebook-sofia-science',
    studentName: 'Sofía Méndez',
    studentCode: 'EST-1215',
    courseId: 'course-science-6a',
    courseName: 'Ciencias Integradas',
    sectionLabel: '6A',
    averageGrade: 96,
    lastEvaluationLabel: 'Actividad diagnóstica · 98',
    pendingEvaluations: 0,
    status: 'on_track',
    trend: 'up',
    trendLabel: 'Progreso destacado',
    period: 'current',
    nextAction: 'Mantener desafío académico',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'gradebook-lucas-history',
    studentName: 'Lucas Quesada',
    studentCode: 'EST-1259',
    courseId: 'course-history-9c',
    courseName: 'Historia Contemporánea',
    sectionLabel: '9C',
    averageGrade: null,
    lastEvaluationLabel: 'Sin evaluación registrada',
    pendingEvaluations: 2,
    status: 'pending',
    trend: 'down',
    trendLabel: 'Sin evidencia reciente',
    period: 'current',
    nextAction: 'Validar continuidad',
    audiences: ['institution'],
  },
  {
    id: 'gradebook-emma-reading',
    studentName: 'Emma Salazar',
    studentCode: 'EST-1303',
    courseId: 'course-reading-5b',
    courseName: 'Lectura y Escritura',
    sectionLabel: '5B',
    averageGrade: 89,
    lastEvaluationLabel: 'Portafolio de cierre · 92',
    pendingEvaluations: 0,
    status: 'on_track',
    trend: 'up',
    trendLabel: 'Cierre favorable',
    period: 'previous',
    nextAction: 'Consultar cierre',
    audiences: ['institution'],
  },
] as const satisfies readonly GradebookV2Record[];

const distributionLabels: Readonly<Record<GradebookV2Range, string>> = {
  high: '90–100',
  middle: '70–89',
  low: 'Menos de 70',
  ungraded: 'Sin nota',
};

export const EMPTY_GRADEBOOK_V2: GradebookV2Fixture = {
  summary: {
    overallAverage: null,
    studentsAtRisk: 0,
    pendingToGrade: 0,
    lastUpdateLabel: 'Sin actualizaciones',
  },
  records: [],
  distribution: [],
  riskRecords: [],
  calculationLabel: 'Cálculo mock no oficial',
};

export function getMockGradebookV2(roleKey: RoleKey): GradebookV2Fixture {
  const audience = gradebookAudienceForRole(roleKey);
  if (!audience) return EMPTY_GRADEBOOK_V2;

  const scopedRecords = records.filter((record) =>
    (record.audiences as readonly GradebookV2Audience[]).includes(audience)
  );
  const gradedRecords = scopedRecords.filter(
    (record): record is typeof record & { averageGrade: number } =>
      record.averageGrade !== null
  );
  const overallAverage =
    gradedRecords.length === 0
      ? null
      : Math.round(
          gradedRecords.reduce((total, record) => total + record.averageGrade, 0) /
            gradedRecords.length
        );
  const ranges: readonly GradebookV2Range[] = [
    'high',
    'middle',
    'low',
    'ungraded',
  ];
  const riskRecords = scopedRecords.filter(
    (record) => record.status === 'risk' || record.status === 'watch'
  );

  return {
    summary: {
      overallAverage,
      studentsAtRisk: riskRecords.length,
      pendingToGrade: scopedRecords.reduce(
        (total, record) => total + record.pendingEvaluations,
        0
      ),
      lastUpdateLabel: 'Hoy · 09:10',
    },
    records: scopedRecords,
    distribution: ranges.map((range) => ({
      range,
      label: distributionLabels[range],
      count: scopedRecords.filter((record) => gradeRangeForRecord(record) === range)
        .length,
    })),
    riskRecords,
    calculationLabel: 'Promedios mock de demostración · no oficiales',
  };
}
