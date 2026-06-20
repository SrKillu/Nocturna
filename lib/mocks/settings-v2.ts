import type { RoleKey } from '@/lib/types/auth';
import type {
  SettingsV2Fixture,
  SettingsV2Panel,
} from '@/lib/types/settings-v2';

const panels = [
  {
    id: 'institution-profile',
    title: 'Perfil institucional',
    description: 'Identidad operativa visible en esta consola mock.',
    fields: [
      { id: 'name', label: 'Institución', value: 'Nocturna Demo' },
      { id: 'modality', label: 'Modalidad', value: 'Académica mixta' },
      { id: 'timezone', label: 'Zona horaria', value: 'América Central' },
      { id: 'language', label: 'Idioma', value: 'Español' },
      { id: 'status', label: 'Estado', value: 'Activa', status: 'active' },
    ],
  },
  {
    id: 'academic-config',
    title: 'Configuración académica',
    description: 'Parámetros ilustrativos sin efecto sobre cursos reales.',
    fields: [
      { id: 'period', label: 'Período', value: 'Ciclo lectivo 2026', status: 'active' },
      { id: 'sections', label: 'Secciones', value: '18 grupos mock' },
      { id: 'grading', label: 'Escala de notas', value: '0 a 100' },
      { id: 'attendance', label: 'Asistencia', value: 'Registro por sesión' },
    ],
  },
  {
    id: 'branding',
    title: 'Branding',
    description: 'Vista previa informativa; no permite cargar ni aplicar cambios.',
    fields: [
      { id: 'primary-color', label: 'Color principal', value: 'Índigo nocturno' },
      { id: 'accent-color', label: 'Color de acento', value: 'Ámbar operativo' },
      { id: 'logo', label: 'Logo', value: 'Placeholder institucional', status: 'planned' },
      { id: 'footer', label: 'Footer', value: 'Nocturna · Entorno educativo demo' },
    ],
  },
  {
    id: 'security',
    title: 'Seguridad',
    description: 'Indicadores visuales sin modificar políticas o sesiones.',
    fields: [
      { id: 'sessions', label: 'Sesiones', value: 'Control V2 activo', status: 'configured' },
      { id: 'policies', label: 'Políticas', value: 'Revisión trimestral mock' },
      { id: 'mfa', label: 'MFA', value: 'Planificado', status: 'planned' },
      { id: 'audit', label: 'Auditoría', value: 'Seguimiento visual', status: 'review' },
    ],
  },
  {
    id: 'roles',
    title: 'Roles',
    description: 'Resumen de roles existentes, sin edición de permisos.',
    fields: [
      { id: 'owner', label: 'Owner', value: 'Gobierno institucional' },
      { id: 'admin', label: 'Admin', value: 'Operación académica' },
      { id: 'teacher', label: 'Teacher', value: 'Docencia y seguimiento' },
      { id: 'assistant', label: 'Assistant', value: 'Apoyo académico' },
      { id: 'student', label: 'Student', value: 'Espacio personal' },
      { id: 'guardian', label: 'Guardian', value: 'Consulta de seguimiento' },
      { id: 'support', label: 'Support', value: 'Soporte limitado' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integraciones',
    description: 'Estados mock; ninguna conexión se ejecuta desde esta vista.',
    fields: [
      { id: 'database', label: 'Supabase', value: 'Referencia del sistema', status: 'configured' },
      { id: 'email', label: 'Correo', value: 'No conectado', status: 'disabled' },
      { id: 'storage', label: 'Storage', value: 'No conectado', status: 'disabled' },
      { id: 'calendar', label: 'Calendario', value: 'No conectado', status: 'disabled' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Preferencias ilustrativas sin envíos ni suscripciones reales.',
    fields: [
      { id: 'in-app', label: 'En la aplicación', value: 'Vista previa activa', status: 'configured' },
      { id: 'email-channel', label: 'Correo', value: 'Deshabilitado', status: 'disabled' },
      { id: 'academic-alerts', label: 'Alertas académicas', value: 'Resumen semanal mock' },
      { id: 'security-alerts', label: 'Alertas de seguridad', value: 'Revisión humana' },
    ],
  },
] as const satisfies readonly SettingsV2Panel[];

export const EMPTY_SETTINGS_V2: SettingsV2Fixture = {
  summary: {
    institutionName: 'Sin institución',
    activeAcademicPeriod: 'Sin período',
    enabledModules: 0,
    pendingConfiguration: 0,
  },
  panels: [],
  disclaimer: 'Sin configuración mock disponible',
};

export function getMockSettingsV2(roleKey: RoleKey): SettingsV2Fixture {
  if (roleKey !== 'owner' && roleKey !== 'admin') {
    return EMPTY_SETTINGS_V2;
  }

  return {
    summary: {
      institutionName: 'Nocturna Demo',
      activeAcademicPeriod: 'Ciclo lectivo 2026',
      enabledModules: 12,
      pendingConfiguration: 3,
    },
    panels,
    disclaimer:
      'Configuración institucional mock de solo lectura · sin cambios persistentes',
  };
}
