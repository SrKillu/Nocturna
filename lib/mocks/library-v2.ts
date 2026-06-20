import type { RoleKey } from '@/lib/types/auth';
import {
  libraryAudienceForRole,
  type LibraryV2Audience,
  type LibraryV2Fixture,
  type LibraryV2Resource,
} from '@/lib/types/library-v2';

const resources = [
  {
    id: 'library-algebra-foundations',
    title: 'Fundamentos de álgebra',
    collectionId: 'collection-core-learning',
    collectionName: 'Aprendizajes esenciales',
    type: 'digital-book',
    courseId: 'course-algebra-10a',
    courseName: 'Álgebra I',
    level: 'secondary',
    levelLabel: 'Secundaria',
    availability: 'featured',
    updatedLabel: 'Hoy · 09:10',
    nextAction: 'Consultar ficha',
    period: 'current',
    featured: true,
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'library-science-observation-guide',
    title: 'Guía para observar el entorno',
    collectionId: 'collection-classroom-guides',
    collectionName: 'Guías para el aula',
    type: 'study-guide',
    courseId: 'course-science-6a',
    courseName: 'Ciencias Integradas',
    level: 'primary',
    levelLabel: 'Primaria',
    availability: 'available',
    updatedLabel: 'Ayer · 15:30',
    nextAction: 'Revisar vigencia',
    period: 'recent',
    featured: false,
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'library-history-context-reading',
    title: 'Lecturas de contexto contemporáneo',
    collectionId: 'collection-complementary-reading',
    collectionName: 'Lecturas complementarias',
    type: 'supplemental-reading',
    courseId: 'course-history-9c',
    courseName: 'Historia Contemporánea',
    level: 'secondary',
    levelLabel: 'Secundaria',
    availability: 'available',
    updatedLabel: 'Hace 2 días',
    nextAction: 'Consultar selección',
    period: 'current',
    featured: true,
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'library-english-conversation-practice',
    title: 'Práctica guiada de conversación',
    collectionId: 'collection-practice-lab',
    collectionName: 'Laboratorio de práctica',
    type: 'practice',
    courseId: 'course-english-11b',
    courseName: 'Inglés B2',
    level: 'secondary',
    levelLabel: 'Secundaria',
    availability: 'available',
    updatedLabel: 'Esta semana',
    nextAction: 'Consultar actividad',
    period: 'current',
    featured: false,
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'library-digital-citizenship-overview',
    title: 'Panorama de ciudadanía digital',
    collectionId: 'collection-institutional',
    collectionName: 'Referencia institucional',
    type: 'external-video',
    courseId: null,
    courseName: 'Referencia general',
    level: 'general',
    levelLabel: 'Institucional',
    availability: 'reference',
    updatedLabel: 'Este mes',
    nextAction: 'Consultar reseña',
    period: 'recent',
    featured: true,
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'library-academic-coexistence-reference',
    title: 'Marco de convivencia académica',
    collectionId: 'collection-institutional',
    collectionName: 'Referencia institucional',
    type: 'institutional-reference',
    courseId: null,
    courseName: 'Referencia general',
    level: 'general',
    levelLabel: 'Institucional',
    availability: 'reference',
    updatedLabel: 'Período anterior',
    nextAction: 'Mantener como referencia',
    period: 'previous',
    featured: false,
    audiences: ['institution'],
  },
] as const satisfies readonly LibraryV2Resource[];

export const EMPTY_LIBRARY_V2: LibraryV2Fixture = {
  summary: {
    availableResources: 0,
    activeCollections: 0,
    featuredResources: 0,
    lastUpdateLabel: 'Sin actualizaciones',
  },
  resources: [],
  collections: [],
  featured: [],
};

export function getMockLibraryV2(roleKey: RoleKey): LibraryV2Fixture {
  const audience = libraryAudienceForRole(roleKey);
  if (!audience) return EMPTY_LIBRARY_V2;

  const scopedResources = resources.filter((resource) =>
    (resource.audiences as readonly LibraryV2Audience[]).includes(audience)
  );
  const collections = Array.from(
    new Map(
      scopedResources.map((resource) => [
        resource.collectionId,
        {
          id: resource.collectionId,
          name: resource.collectionName,
          description: `Selección mock para ${resource.collectionName.toLocaleLowerCase('es')}.`,
          resourceCount: scopedResources.filter(
            (item) => item.collectionId === resource.collectionId
          ).length,
        },
      ])
    ).values()
  );
  const featured = scopedResources.filter((resource) => resource.featured);

  return {
    summary: {
      availableResources: scopedResources.length,
      activeCollections: collections.length,
      featuredResources: featured.length,
      lastUpdateLabel: scopedResources[0]?.updatedLabel ?? 'Sin actualizaciones',
    },
    resources: scopedResources,
    collections,
    featured,
  };
}
