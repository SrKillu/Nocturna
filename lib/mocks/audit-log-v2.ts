import type { RoleKey } from '@/lib/types/auth';
import type {
  AuditLogV2Event,
  AuditLogV2Fixture,
} from '@/lib/types/audit-log-v2';

const events = [
  {
    id: 'audit-sign-in-owner',
    title: 'Inicio de sesión institucional',
    module: 'auth',
    moduleLabel: 'Auth',
    eventType: 'sign-in',
    actorId: 'actor-owner-demo',
    actorLabel: 'Owner demo',
    resourceLabel: 'Sesión institucional mock',
    severity: 'info',
    status: 'recorded',
    occurredAtLabel: 'Hoy · 08:12',
    nextAction: 'Sin seguimiento',
    period: 'today',
  },
  {
    id: 'audit-settings-review',
    title: 'Revisión de configuración',
    module: 'settings',
    moduleLabel: 'Settings',
    eventType: 'settings-change',
    actorId: 'actor-admin-demo',
    actorLabel: 'Administración demo',
    resourceLabel: 'Perfil institucional mock',
    severity: 'notice',
    status: 'review',
    occurredAtLabel: 'Hoy · 09:05',
    nextAction: 'Validar observación',
    period: 'today',
  },
  {
    id: 'audit-role-preview',
    title: 'Cambio de rol simulado',
    module: 'staff',
    moduleLabel: 'Staff',
    eventType: 'role-change',
    actorId: 'actor-admin-demo',
    actorLabel: 'Administración demo',
    resourceLabel: 'Rol académico de demostración',
    severity: 'warning',
    status: 'resolved',
    occurredAtLabel: 'Ayer · 14:40',
    nextAction: 'Mantener revisión humana',
    period: 'week',
  },
  {
    id: 'audit-course-update',
    title: 'Actualización académica mock',
    module: 'courses',
    moduleLabel: 'Courses',
    eventType: 'academic-update',
    actorId: 'actor-academic-demo',
    actorLabel: 'Coordinación demo',
    resourceLabel: 'Álgebra I · planificación',
    severity: 'info',
    status: 'recorded',
    occurredAtLabel: 'Hace 2 días',
    nextAction: 'Consultar contexto',
    period: 'week',
  },
  {
    id: 'audit-denied-attempt',
    title: 'Intento de acceso denegado',
    module: 'auth',
    moduleLabel: 'Auth',
    eventType: 'denied-attempt',
    actorId: 'actor-unknown-demo',
    actorLabel: 'Actor no identificado mock',
    resourceLabel: 'Consola administrativa',
    severity: 'critical',
    status: 'review',
    occurredAtLabel: 'Hace 3 días',
    nextAction: 'Revisar señal mock',
    period: 'week',
  },
  {
    id: 'audit-report-export-preview',
    title: 'Exportación simulada de reporte',
    module: 'reports',
    moduleLabel: 'Reports',
    eventType: 'simulated-export',
    actorId: 'actor-owner-demo',
    actorLabel: 'Owner demo',
    resourceLabel: 'Resumen académico mock',
    severity: 'notice',
    status: 'recorded',
    occurredAtLabel: 'Esta semana',
    nextAction: 'Sin archivo generado',
    period: 'week',
  },
  {
    id: 'audit-membership-preview',
    title: 'Cambio de membresía simulado',
    module: 'enrollments',
    moduleLabel: 'Enrollments',
    eventType: 'membership-change',
    actorId: 'actor-admin-demo',
    actorLabel: 'Administración demo',
    resourceLabel: 'Matrícula demo 10A',
    severity: 'notice',
    status: 'resolved',
    occurredAtLabel: 'Este mes',
    nextAction: 'Consultar historial mock',
    period: 'month',
  },
  {
    id: 'audit-library-admin',
    title: 'Acción administrativa informativa',
    module: 'library',
    moduleLabel: 'Library',
    eventType: 'admin-action',
    actorId: 'actor-owner-demo',
    actorLabel: 'Owner demo',
    resourceLabel: 'Colección institucional mock',
    severity: 'info',
    status: 'recorded',
    occurredAtLabel: 'Período anterior',
    nextAction: 'Sin seguimiento',
    period: 'previous',
  },
] as const satisfies readonly AuditLogV2Event[];

export const EMPTY_AUDIT_LOG_V2: AuditLogV2Fixture = {
  summary: {
    recordedEvents: 0,
    criticalEvents: 0,
    administrativeChanges: 0,
    lastReviewLabel: 'Sin revisiones',
  },
  events: [],
  recentActivity: [],
  riskSignals: [],
  disclaimer: 'Sin actividad mock disponible',
};

export function getMockAuditLogV2(roleKey: RoleKey): AuditLogV2Fixture {
  if (roleKey !== 'owner' && roleKey !== 'admin') {
    return EMPTY_AUDIT_LOG_V2;
  }

  return {
    summary: {
      recordedEvents: events.length,
      criticalEvents: events.filter((event) => event.severity === 'critical')
        .length,
      administrativeChanges: events.filter((event) =>
        ['settings-change', 'role-change', 'admin-action'].includes(
          event.eventType
        )
      ).length,
      lastReviewLabel: 'Hoy · 10:30',
    },
    events,
    recentActivity: events.slice(0, 4),
    riskSignals: [
      {
        id: 'risk-denied-access',
        title: 'Acceso denegado en revisión',
        detail: 'Señal mock sin dirección de red ni identidad real.',
        severity: 'critical',
      },
      {
        id: 'risk-role-review',
        title: 'Cambio de rol observado',
        detail: 'Evento simulado pendiente de validación humana.',
        severity: 'warning',
      },
    ],
    disclaimer:
      'Auditoría mock de solo lectura · no representa actividad real',
  };
}
