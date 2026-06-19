import {
  courseAudienceForRole,
  type CourseV2Audience,
  type CourseV2ListItem,
  type CourseV2Workspace,
} from '@/lib/types/courses-v2';
import type { RoleKey } from '@/lib/types/auth';

const courses = [
  {
    id: 'course-algebra-10a',
    name: 'Álgebra I',
    code: 'MAT-10A',
    teacherName: 'María Solís',
    studentCount: 28,
    status: 'active',
    level: 'secondary',
    levelLabel: 'Secundaria',
    scheduleLabel: 'Matutina',
    category: 'sciences',
    categoryLabel: 'Ciencias',
    nextAction: 'Revisar planificación',
    audiences: ['institution', 'teacher', 'student'],
  },
  {
    id: 'course-english-11b',
    name: 'Inglés B2',
    code: 'ING-11B',
    teacherName: 'Daniel Rojas',
    studentCount: 24,
    status: 'active',
    level: 'secondary',
    levelLabel: 'Secundaria',
    scheduleLabel: 'Matutina',
    category: 'languages',
    categoryLabel: 'Idiomas',
    nextAction: 'Registrar asistencia',
    audiences: ['institution', 'teacher', 'student'],
  },
  {
    id: 'course-science-6a',
    name: 'Ciencias Integradas',
    code: 'CIE-06A',
    teacherName: 'Elena Vega',
    studentCount: 31,
    status: 'active',
    level: 'primary',
    levelLabel: 'Primaria',
    scheduleLabel: 'Matutina',
    category: 'sciences',
    categoryLabel: 'Ciencias',
    nextAction: 'Publicar material',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'course-history-9c',
    name: 'Historia Contemporánea',
    code: 'HIS-09C',
    teacherName: 'Andrés Mora',
    studentCount: 26,
    status: 'planning',
    level: 'secondary',
    levelLabel: 'Secundaria',
    scheduleLabel: 'Vespertina',
    category: 'humanities',
    categoryLabel: 'Humanidades',
    nextAction: 'Completar programa',
    audiences: ['institution', 'teacher'],
  },
  {
    id: 'course-technology-8a',
    name: 'Tecnología Aplicada',
    code: 'TEC-08A',
    teacherName: 'Sofía Castro',
    studentCount: 22,
    status: 'planning',
    level: 'secondary',
    levelLabel: 'Secundaria',
    scheduleLabel: 'Vespertina',
    category: 'technology',
    categoryLabel: 'Tecnología',
    nextAction: 'Asignar recursos',
    audiences: ['institution'],
  },
  {
    id: 'course-reading-5b',
    name: 'Lectura y Escritura',
    code: 'ESP-05B',
    teacherName: 'Lucía Herrera',
    studentCount: 29,
    status: 'completed',
    level: 'primary',
    levelLabel: 'Primaria',
    scheduleLabel: 'Matutina',
    category: 'languages',
    categoryLabel: 'Idiomas',
    nextAction: 'Consultar cierre',
    audiences: ['institution', 'student'],
  },
] as const satisfies readonly CourseV2ListItem[];

export function getMockCoursesV2(roleKey: RoleKey): readonly CourseV2ListItem[] {
  const audience = courseAudienceForRole(roleKey);
  if (!audience) return [];
  return courses.filter((course) =>
    (course.audiences as readonly CourseV2Audience[]).includes(audience)
  );
}

const summaries: Record<string, string> = {
  'course-algebra-10a':
    'Seguimiento del grupo de Álgebra I, con foco en expresiones, ecuaciones y resolución guiada de problemas.',
  'course-english-11b':
    'Espacio de práctica B2 para comprensión, conversación y producción escrita en contextos académicos.',
  'course-science-6a':
    'Secuencia integrada de ciencias para observar, experimentar y documentar fenómenos del entorno.',
  'course-history-9c':
    'Preparación del recorrido por procesos sociales y políticos de la historia contemporánea.',
  'course-technology-8a':
    'Planificación de proyectos aplicados para resolver necesidades escolares con herramientas digitales.',
  'course-reading-5b':
    'Cierre del curso de lectura y escritura con evidencias de comprensión y producción textual.',
};

function buildWorkspace(course: CourseV2ListItem): CourseV2Workspace {
  return {
    ...course,
    summary: summaries[course.id] ?? 'Espacio académico de demostración para seguimiento del curso.',
    termLabel: 'Ciclo lectivo 2026',
    roomLabel: course.scheduleLabel === 'Matutina' ? 'Aula 204' : 'Aula 112',
    workQueue: [
      {
        id: `${course.id}-work-1`,
        title: course.nextAction,
        context: `Prioridad operativa para ${course.name}.`,
        dueLabel: 'Esta semana',
        priority: course.status === 'planning' ? 'high' : 'medium',
      },
      {
        id: `${course.id}-work-2`,
        title: 'Revisar progreso del grupo',
        context: 'Validar avances y registrar observaciones de seguimiento.',
        dueLabel: 'Próxima sesión',
        priority: 'low',
      },
    ],
    rosterPreview: [
      {
        id: `${course.id}-student-1`,
        name: 'Valeria Gómez',
        detail: 'Participación al día',
        status: 'active',
      },
      {
        id: `${course.id}-student-2`,
        name: 'Mateo Jiménez',
        detail: 'Seguimiento recomendado',
        status: 'pending',
      },
      {
        id: `${course.id}-student-3`,
        name: 'Camila Vargas',
        detail: 'Actividades completadas',
        status: 'completed',
      },
    ],
    evaluationsPreview: [
      {
        id: `${course.id}-evaluation-1`,
        title: 'Actividad diagnóstica',
        detail: 'Disponible para revisión',
        status: 'active',
      },
      {
        id: `${course.id}-evaluation-2`,
        title: 'Proyecto de unidad',
        detail: 'Borrador de demostración',
        status: 'draft',
      },
    ],
    materialsPreview: [
      {
        id: `${course.id}-material-1`,
        title: 'Guía de trabajo',
        detail: 'Documento de apoyo · actualizado recientemente',
        status: 'active',
      },
      {
        id: `${course.id}-material-2`,
        title: 'Recursos de la unidad',
        detail: 'Colección de enlaces de demostración',
        status: 'draft',
      },
    ],
  };
}

export function getMockCourseWorkspaceV2(
  courseId: string,
  roleKey: RoleKey
): CourseV2Workspace | null {
  const course = getMockCoursesV2(roleKey).find((item) => item.id === courseId);
  return course ? buildWorkspace(course) : null;
}
