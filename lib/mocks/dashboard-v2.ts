import type {
  DashboardV2Variant,
  DashboardV2ViewModel,
} from '@/lib/types/dashboard-v2';

const dashboards = {
  institution: {
    variant: 'institution',
    heading: 'Operacion institucional',
    summary: '3 alertas abiertas · 842 estudiantes · 46 miembros de staff',
    primaryAction: {
      label: 'Invitar usuario',
      requiredCapability: 'canManageUsers',
    },
    metrics: [
      { id: 'mock-students', label: 'Estudiantes', value: '842', hint: '816 activos', tone: 'neutral' },
      { id: 'mock-staff', label: 'Staff activo', value: '46', hint: '4 pendientes', tone: 'info' },
      { id: 'mock-attendance', label: 'Asistencia', value: '91%', hint: 'Ultimos 7 dias', tone: 'success' },
      { id: 'mock-submissions', label: 'Entregas', value: '128', hint: 'Esperando revision', tone: 'warning' },
      { id: 'mock-courses', label: 'Cursos', value: '31', hint: '4 requieren atencion', tone: 'neutral' },
    ],
    workQueue: [
      {
        id: 'mock-request-review',
        priority: 'high',
        title: '12 solicitudes de ingreso',
        context: 'Nuevas memberships esperan revision.',
        dueLabel: 'Hoy',
        actionLabel: 'Revisar',
        requiredCapability: 'canManageUsers',
      },
      {
        id: 'mock-unassigned-courses',
        priority: 'high',
        title: '4 cursos sin profesor asignado',
        context: 'Las secciones no pueden iniciar actividad.',
        actionLabel: 'Asignar staff',
        requiredCapability: 'canManageCourses',
      },
      {
        id: 'mock-unassigned-students',
        priority: 'medium',
        title: '27 estudiantes sin seccion activa',
        context: 'Revisa matriculas y asignaciones.',
        actionLabel: 'Revisar',
        requiredCapability: 'canManageUsers',
      },
      {
        id: 'mock-reports',
        priority: 'low',
        title: '3 reportes listos para revision',
        context: 'Resumen academico del periodo actual.',
        actionLabel: 'Ver reportes',
        requiredCapability: 'canViewReports',
      },
    ],
    activityTitle: 'Actividad institucional',
    activity: [
      { id: 'mock-a1', title: 'Material publicado', metadata: 'Guia de Algebra I', timestampLabel: 'Hace 18 min', tone: 'info' },
      { id: 'mock-a2', title: 'Asistencia cerrada', metadata: '23 sesiones procesadas', timestampLabel: 'Hace 42 min', tone: 'success' },
      { id: 'mock-a3', title: 'Staff invitado', metadata: '2 invitaciones pendientes', timestampLabel: 'Hace 1 h', tone: 'neutral' },
      { id: 'mock-a4', title: 'Alerta academica', metadata: 'Curso con asistencia baja', timestampLabel: 'Hace 3 h', tone: 'warning' },
    ],
  },
  teacher: {
    variant: 'teacher',
    heading: 'Mi jornada docente',
    summary: '4 secciones · 18 entregas por revisar · 2 asistencias pendientes',
    primaryAction: {
      label: 'Nueva evaluacion',
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
        context: 'Algebra I · 9 entregas',
        dueLabel: 'Hoy',
        actionLabel: 'Revisar',
        requiredCapability: 'canGrade',
      },
      {
        id: 'mock-take-attendance',
        priority: 'high',
        title: 'Tomar asistencia',
        context: 'Ingles B2 · Seccion 11-B',
        dueLabel: '10:00',
        actionLabel: 'Abrir',
        requiredCapability: 'canManageAttendance',
      },
      {
        id: 'mock-chat',
        priority: 'medium',
        title: 'Responder conversacion',
        context: 'Biologia · 2 mensajes nuevos',
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
      { id: 'mock-t1', title: 'Algebra I · 10-A', metadata: 'Aula 204', timestampLabel: '08:00', tone: 'neutral' },
      { id: 'mock-t2', title: 'Ingles B2 · 11-B', metadata: 'Asistencia pendiente', timestampLabel: '10:00', tone: 'warning' },
      { id: 'mock-t3', title: 'Tutoria · 9-C', metadata: 'Sesion individual', timestampLabel: '13:00', tone: 'info' },
    ],
  },
  student: {
    variant: 'student',
    heading: 'Mi espacio academico',
    summary: '5 cursos · 3 tareas pendientes · 2 feedback nuevos',
    metrics: [
      { id: 'mock-pending', label: 'Pendientes', value: '3', hint: 'Proximas entregas', tone: 'warning' },
      { id: 'mock-submitted', label: 'Entregadas', value: '12', hint: 'Periodo actual', tone: 'success' },
      { id: 'mock-average', label: 'Promedio', value: '86', hint: 'Calificacion general', tone: 'info' },
      { id: 'mock-attendance', label: 'Asistencia', value: '94%', hint: 'Periodo actual', tone: 'success' },
    ],
    workQueue: [
      {
        id: 'mock-submit-algebra',
        priority: 'high',
        title: 'Tarea 3',
        context: 'Algebra I',
        dueLabel: 'Hoy',
        actionLabel: 'Subir entrega',
        requiredCapability: 'canSubmit',
      },
      {
        id: 'mock-biology-report',
        priority: 'medium',
        title: 'Informe de laboratorio',
        context: 'Biologia',
        dueLabel: 'Viernes',
        actionLabel: 'Abrir',
        requiredCapability: 'canSubmit',
      },
      {
        id: 'mock-english-essay',
        priority: 'low',
        title: 'Ensayo corto',
        context: 'Ingles B2',
        dueLabel: 'Lunes',
        actionLabel: 'Abrir',
        requiredCapability: 'canSubmit',
      },
    ],
    activityTitle: 'Feedback reciente',
    activity: [
      { id: 'mock-s1', title: 'Ingles B2', metadata: 'Buen avance en estructura.', timestampLabel: 'Ayer', tone: 'success' },
      { id: 'mock-s2', title: 'Historia', metadata: 'Revisa las fuentes citadas.', timestampLabel: 'Hace 2 dias', tone: 'info' },
      { id: 'mock-s3', title: 'Material nuevo', metadata: 'Biologia · Guia de laboratorio', timestampLabel: 'Hace 3 dias', tone: 'neutral' },
    ],
  },
  staff: {
    variant: 'staff',
    heading: 'Resumen de actividad',
    summary: 'Vista limitada segun las capacidades de tu membership activa.',
    metrics: [
      { id: 'mock-reports', label: 'Reportes', value: '6', hint: 'Disponibles', tone: 'info' },
      { id: 'mock-messages', label: 'Mensajes', value: '2', hint: 'Sin leer', tone: 'neutral' },
    ],
    workQueue: [],
    activityTitle: 'Actividad disponible',
    activity: [
      { id: 'mock-staff-1', title: 'Reporte actualizado', metadata: 'Resumen del periodo', timestampLabel: 'Hoy', tone: 'info' },
      { id: 'mock-staff-2', title: 'Mensaje institucional', metadata: 'Comunicado general', timestampLabel: 'Ayer', tone: 'neutral' },
    ],
  },
} as const satisfies Record<DashboardV2Variant, DashboardV2ViewModel>;

export function getMockDashboardV2(variant: DashboardV2Variant): DashboardV2ViewModel {
  return dashboards[variant];
}
