import type { RoleKey } from '@/lib/types/auth';
import {
  materialAudienceForRole,
  type MaterialV2Audience,
  type MaterialV2ListItem,
  type MaterialsV2Fixture,
} from '@/lib/types/materials-v2';

const materials = [
  {
    id: 'material-algebra-equations-guide',
    title: 'Guía de ecuaciones lineales',
    courseId: 'course-algebra-10a',
    courseName: 'Álgebra I',
    sectionLabel: '10A',
    type: 'document',
    visibility: 'course',
    status: 'published',
    updatedLabel: 'Hoy · 08:15',
    period: 'current',
    nextAction: 'Revisar vigencia',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'material-english-speaking-slides',
    title: 'Apoyo para presentación oral',
    courseId: 'course-english-11b',
    courseName: 'Inglés B2',
    sectionLabel: '11B',
    type: 'slides',
    visibility: 'course',
    status: 'published',
    updatedLabel: 'Ayer · 14:20',
    period: 'recent',
    nextAction: 'Sin seguimiento',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'material-science-observation-video',
    title: 'Introducción a la observación',
    courseId: 'course-science-6a',
    courseName: 'Ciencias Integradas',
    sectionLabel: '6A',
    type: 'video',
    visibility: 'draft',
    status: 'pending',
    updatedLabel: 'Hace 2 días',
    period: 'recent',
    nextAction: 'Validar publicación',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'material-history-reading-list',
    title: 'Lecturas para la unidad',
    courseId: 'course-history-9c',
    courseName: 'Historia Contemporánea',
    sectionLabel: '9C',
    type: 'link',
    visibility: 'staff',
    status: 'pending',
    updatedLabel: 'Hace 3 días',
    period: 'current',
    nextAction: 'Revisar selección',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'material-technology-project-rubric',
    title: 'Rúbrica de proyecto aplicado',
    courseId: 'course-technology-8a',
    courseName: 'Tecnología Aplicada',
    sectionLabel: '8A',
    type: 'document',
    visibility: 'course',
    status: 'published',
    updatedLabel: 'Esta semana',
    period: 'current',
    nextAction: 'Consultar uso',
    audiences: ['institution'],
  },
  {
    id: 'material-reading-closing-portfolio',
    title: 'Orientaciones de portafolio',
    courseId: 'course-reading-5b',
    courseName: 'Lectura y Escritura',
    sectionLabel: '5B',
    type: 'slides',
    visibility: 'course',
    status: 'archived',
    updatedLabel: 'Período anterior',
    period: 'previous',
    nextAction: 'Mantener archivado',
    audiences: ['institution'],
  },
] as const satisfies readonly MaterialV2ListItem[];

export const EMPTY_MATERIALS_V2: MaterialsV2Fixture = {
  summary: {
    publishedMaterials: 0,
    pendingMaterials: 0,
    coursesWithRecentMaterials: 0,
    lastUpdateLabel: 'Sin actualizaciones',
  },
  materials: [],
  recent: [],
};

export function getMockMaterialsV2(roleKey: RoleKey): MaterialsV2Fixture {
  const audience = materialAudienceForRole(roleKey);
  if (!audience) return EMPTY_MATERIALS_V2;

  const scopedMaterials = materials.filter((material) =>
    (material.audiences as readonly MaterialV2Audience[]).includes(audience)
  );
  const recent = scopedMaterials
    .filter((material) => material.period !== 'previous')
    .slice(0, 4);

  return {
    summary: {
      publishedMaterials: scopedMaterials.filter(
        (material) => material.status === 'published'
      ).length,
      pendingMaterials: scopedMaterials.filter(
        (material) => material.status === 'pending'
      ).length,
      coursesWithRecentMaterials: new Set(recent.map((material) => material.courseId))
        .size,
      lastUpdateLabel: recent[0]?.updatedLabel ?? 'Sin actualizaciones',
    },
    materials: scopedMaterials,
    recent,
  };
}
