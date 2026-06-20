import type { RoleKey } from '@/lib/types/auth';
import type {
  CertificateV2ListItem,
  CertificatesV2Fixture,
} from '@/lib/types/certificates-v2';

const certificates = [
  {
    id: 'certificate-demo-approval-1042',
    recipientLabel: 'Estudiante demo 1042',
    recipientCode: 'EST-1042',
    type: 'approval',
    courseId: 'course-algebra-10a',
    courseLabel: 'Álgebra I',
    sectionLabel: '10A',
    period: 'current',
    periodLabel: 'Ciclo lectivo 2026',
    status: 'ready',
    eligibility: 'eligible',
    nextAction: 'Revisión administrativa',
  },
  {
    id: 'certificate-demo-attendance-1078',
    recipientLabel: 'Estudiante demo 1078',
    recipientCode: 'EST-1078',
    type: 'attendance',
    courseId: 'course-algebra-10a',
    courseLabel: 'Álgebra I',
    sectionLabel: '10A',
    period: 'current',
    periodLabel: 'Ciclo lectivo 2026',
    status: 'review',
    eligibility: 'review',
    nextAction: 'Validar asistencia mock',
  },
  {
    id: 'certificate-demo-enrollment-1126',
    recipientLabel: 'Estudiante demo 1126',
    recipientCode: 'EST-1126',
    type: 'enrollment',
    courseId: 'course-english-11b',
    courseLabel: 'Inglés B2',
    sectionLabel: '11B',
    period: 'current',
    periodLabel: 'Ciclo lectivo 2026',
    status: 'pending',
    eligibility: 'eligible',
    nextAction: 'Confirmar período mock',
  },
  {
    id: 'certificate-demo-completion-1184',
    recipientLabel: 'Estudiante demo 1184',
    recipientCode: 'EST-1184',
    type: 'completion',
    courseId: 'course-science-6a',
    courseLabel: 'Ciencias Integradas',
    sectionLabel: '6A',
    period: 'current',
    periodLabel: 'Ciclo lectivo 2026',
    status: 'blocked',
    eligibility: 'not_eligible',
    nextAction: 'Revisar evidencias pendientes',
  },
  {
    id: 'certificate-demo-recognition-1215',
    recipientLabel: 'Grupo demo 6A',
    recipientCode: 'GRP-06A',
    type: 'recognition',
    courseId: 'course-science-6a',
    courseLabel: 'Ciencias Integradas',
    sectionLabel: '6A',
    period: 'previous',
    periodLabel: 'Período anterior',
    status: 'review',
    eligibility: 'review',
    nextAction: 'Validar criterios mock',
  },
] as const satisfies readonly CertificateV2ListItem[];

export const EMPTY_CERTIFICATES_V2: CertificatesV2Fixture = {
  summary: {
    pendingCertificates: 0,
    eligibleStudents: 0,
    availableTemplates: 0,
    lastReviewLabel: 'Sin revisiones',
  },
  certificates: [],
  readiness: [],
  templates: [],
  disclaimer: 'Consola mock sin emisión documental',
};

export function getMockCertificatesV2(roleKey: RoleKey): CertificatesV2Fixture {
  if (roleKey !== 'owner' && roleKey !== 'admin') {
    return EMPTY_CERTIFICATES_V2;
  }

  return {
    summary: {
      pendingCertificates: certificates.filter(
        (certificate) =>
          certificate.status === 'pending' || certificate.status === 'review'
      ).length,
      eligibleStudents: certificates.filter(
        (certificate) => certificate.eligibility === 'eligible'
      ).length,
      availableTemplates: 3,
      lastReviewLabel: 'Hoy · 10:20',
    },
    certificates,
    readiness: [
      {
        id: 'readiness-academic',
        label: 'Criterios académicos',
        detail: 'Reglas ilustrativas revisadas para el período mock.',
        status: 'complete',
      },
      {
        id: 'readiness-attendance',
        label: 'Asistencia',
        detail: 'Dos registros requieren validación humana.',
        status: 'review',
      },
      {
        id: 'readiness-identity',
        label: 'Datos institucionales',
        detail: 'Solo referencias demo; no hay documentos oficiales.',
        status: 'review',
      },
    ],
    templates: [
      {
        id: 'template-approval',
        name: 'Aprobación',
        detail: 'Estructura visual de demostración.',
        statusLabel: 'Disponible como mock',
      },
      {
        id: 'template-enrollment',
        name: 'Matrícula',
        detail: 'Estructura visual de demostración.',
        statusLabel: 'Disponible como mock',
      },
      {
        id: 'template-attendance',
        name: 'Asistencia',
        detail: 'Estructura visual de demostración.',
        statusLabel: 'En revisión mock',
      },
    ],
    disclaimer:
      'Datos y elegibilidad mock · no constituyen certificados oficiales',
  };
}
