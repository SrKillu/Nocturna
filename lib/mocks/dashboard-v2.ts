import type {
  DashboardV2Variant,
  DashboardV2ViewModel,
} from '@/lib/types/dashboard-v2';

const dashboards = {
  institution: {
    variant: 'institution',
    heading: 'Operación institucional',
    summary: '3 alertas abiertas · 842 estudiantes · 46 miembros del personal',
    primaryAction: {
      label: 'Invitar usuario',
      requiredCapability: 'canManageUsers',
    },
    metrics: [
      { id: 'mock-students', label: 'Estudiantes', value: '842', hint: '816 activos', tone: 'neutral' },
      { id: 'mock-staff', label: 'Personal activo', value: '46', hint: '4 pendientes', tone: 'info' },
      { id: 'mock-attendance', label: 'Asistencia', value: '91%', hint: 'Últimos 7 días', tone: 'success' },
      { id: 'mock-submissions', label: 'Entregas', value: '128', hint: 'Esperando revisión', tone: 'warning' },
      { id: 'mock-courses', label: 'Cursos', value: '31', hint: '4 requieren atención', tone: 'neutral' },
    ],
    workQueue: [
      {
        id: 'mock-request-review',
        priority: 'high',
        title: '12 solicitudes de ingreso',
        context: 'Nuevas membresías esperan revisión.',
        dueLabel: 'Hoy',
        actionLabel: 'Revisar',
        requiredCapability: 'canManageUsers',
      },
      {
        id: 'mock-unassigned-courses',
        priority: 'high',
        title: '4 cursos sin profesor asignado',
        context: 'Las secciones no pueden iniciar actividad.',
        actionLabel: 'Asignar personal',
        requiredCapability: 'canManageCourses',
      },
      {
        id: 'mock-unassigned-students',
        priority: 'medium',
        title: '27 estudiantes sin sección activa',
        context: 'Revisa matrículas y asignaciones.',
        actionLabel: 'Revisar',
        requiredCapability: 'canManageUsers',
      },
      {
        id: 'mock-reports',
        priority: 'low',
        title: '3 reportes listos para revisión',
        context: 'Resumen académico del período actual.',
        actionLabel: 'Ver reportes',
        requiredCapability: 'canViewReports',
      },
    ],
    activityTitle: 'Actividad institucional',
    activity: [
      { id: 'mock-a1', title: 'Material publicado', metadata: 'Guía de Álgebra I', timestampLabel: 'Hace 18 min', tone: 'info' },
      { id: 'mock-a2', title: 'Asistencia cerrada', metadata: '23 sesiones procesadas', timestampLabel: 'Hace 42 min', tone: 'success' },
      { id: 'mock-a3', title: 'Personal invitado', metadata: '2 invitaciones pendientes', timestampLabel: 'Hace 1 h', tone: 'neutral' },
      { id: 'mock-a4', title: 'Alerta académica', metadata: 'Curso con asistencia baja', timestampLabel: 'Hace 3 h', tone: 'warning' },
    ],
  },
  teacher: {
    variant: 'teacher',
    heading: 'Mi jornada docente',
    summary: '4 secciones · 18 entregas por revisar · 2 asistencias pendientes',
    primaryAction: {
      label: 'Nueva evaluación',
      requiredCapability: 'canGrade',
    },
    metrics: [
      { id: 'mock-review', label: 'Por revisar', value: '18', hint: 'Entregas recibidas', tone: 'warning' },
      { id: 'mock-attendance', label: 'Asistencia', value: '2', hint: 'Sesiones pendientes', tone: 'danger' },
      { id: 'mock-courses', label: 'Cursos', value: '4', hint: 'Secciones activas', tone: 'neutral' },
      { id: 'mock-messages', label: 'Mensajes', value: '6', hint: 'Sin leer', tone: 'info' },
    ],
    workQueue: [
      {
        id: 'mock-grade-algebra',
        priority: 'high',
        title: 'Calificar Tarea 3',
        context: 'Álgebra I · 9 entregas',
        dueLabel: 'Hoy',
        actionLabel: 'Revisar',
        requiredCapability: 'canGrade',
      },
      {
        id: 'mock-take-attendance',
        priority: 'high',
        title: 'Tomar asistencia',
        context: 'Inglés B2 · Sección 11-B',
        dueLabel: '10:00',
        actionLabel: 'Abrir',
        requiredCapability: 'canManageAttendance',
      },
      {
        id: 'mock-chat',
        priority: 'medium',
        title: 'Responder conversación',
        context: 'Biología · 2 mensajes nuevos',
        actionLabel: 'Abrir chat',
        requiredCapability: 'canUseChat',
      },
      {
        id: 'mock-material',
        priority: 'low',
        title: 'Publicar material de clase',
        context: 'Historia · Semana 4',
        actionLabel: 'Preparar',
        requiredCapability: 'canManageMaterials',
      },
    ],
    activityTitle: 'Agenda de hoy',
    activity: [
      { id: 'mock-t1', title: 'Álgebra I · 10-A', metadata: 'Aula 204', timestampLabel: '08:00', tone: 'neutral' },
      { id: 'mock-t2', title: 'Inglés B2 · 11-B', metadata: 'Asistencia pendiente', timestampLabel: '10:00', tone: 'warning' },
      { id: 'mock-t3', title: 'Tutoría · 9-C', metadata: 'Sesión individual', timestampLabel: '13:00', tone: 'info' },
    ],
  },
  student: {
    variant: 'student',
    heading: 'Mi espacio académico',
    summary: '5 cursos · 3 tareas pendientes · 2 comentarios nuevos',
    metrics: [
      { id: 'mock-pending', label: 'Pendientes', value: '3', hint: 'Próximas entregas', tone: 'warning' },
      { id: 'mock-submitted', label: 'Entregadas', value: '12', hint: 'Período actual', tone: 'success' },
      { id: 'mock-average', label: 'Promedio', value: '86', hint: 'Calificación general', tone: 'info' },
      { id: 'mock-attendance', label: 'Asistencia', value: '94%', hint: 'Período actual', tone: 'success' },
    ],
    workQueue: [
      {
        id: 'mock-submit-algebra',
        priority: 'high',
        title: 'Tarea 3',
        context: 'Álgebra I',
        dueLabel: 'Hoy',
        actionLabel: 'Subir entrega',
        requiredCapability: 'canSubmit',
      },
      {
        id: 'mock-biology-report',
        priority: 'medium',
        title: 'Informe de laboratorio',
        context: 'Biología',
        dueLabel: 'Viernes',
        actionLabel: 'Abrir',
        requiredCapability: 'canSubmit',
      },
      {
        id: 'mock-english-essay',
        priority: 'low',
        title: 'Ensayo corto',
        context: 'Inglés B2',
        dueLabel: 'Lunes',
        actionLabel: 'Abrir',
        requiredCapability: 'canSubmit',
      },
    ],
    activityTitle: 'Comentarios recientes',
    activity: [
      { id: 'mock-s1', title: 'Inglés B2', metadata: 'Buen avance en estructura.', timestampLabel: 'Ayer', tone: 'success' },
      { id: 'mock-s2', title: 'Historia', metadata: 'Revisa las fuentes citadas.', timestampLabel: 'Hace 2 días', tone: 'info' },
      { id: 'mock-s3', title: 'Material nuevo', metadata: 'Biología · Guía de laboratorio', timestampLabel: 'Hace 3 días', tone: 'neutral' },
    ],
  },
  staff: {
    variant: 'staff',
    heading: 'Resumen de actividad',
    summary: 'Vista limitada según las capacidades de tu membresía activa.',
    metrics: [
      { id: 'mock-reports', label: 'Reportes', value: '6', hint: 'Disponibles', tone: 'info' },
      { id: 'mock-messages', label: 'Mensajes', value: '2', hint: 'Sin leer', tone: 'neutral' },
    ],
    workQueue: [],
    activityTitle: 'Actividad disponible',
    activity: [
      { id: 'mock-staff-1', title: 'Reporte actualizado', metadata: 'Resumen del período', timestampLabel: 'Hoy', tone: 'info' },
      { id: 'mock-staff-2', title: 'Mensaje institucional', metadata: 'Comunicado general', timestampLabel: 'Ayer', tone: 'neutral' },
    ],
  },
} as const satisfies Record<DashboardV2Variant, DashboardV2ViewModel>;

export function getMockDashboardV2(variant: DashboardV2Variant): DashboardV2ViewModel {
  return dashboards[variant];
}
