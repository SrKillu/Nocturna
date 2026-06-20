import type { RoleKey } from '@/lib/types/auth';
import type { StaffV2Fixture, StaffV2ListItem } from '@/lib/types/staff-v2';

const staff = [
  {
    id: 'staff-demo-admin-01',
    displayName: 'Administración demo 01',
    staffCode: 'PER-ADM-01',
    role: 'admin',
    area: 'administration',
    areaLabel: 'Administración',
    assignmentId: 'institution-operations',
    assignmentLabel: 'Operación institucional',
    status: 'active',
    workload: 'balanced',
    workloadLabel: 'Cobertura estable',
    nextAction: 'Revisar calendario institucional',
  },
  {
    id: 'staff-demo-teacher-02',
    displayName: 'Docente demo 02',
    staffCode: 'PER-DOC-02',
    role: 'teacher',
    area: 'sciences',
    areaLabel: 'Ciencias',
    assignmentId: 'course-algebra-10a',
    assignmentLabel: 'Álgebra I · 10A',
    status: 'active',
    workload: 'review',
    workloadLabel: '3 grupos asignados',
    nextAction: 'Revisar distribución mock',
  },
  {
    id: 'staff-demo-teacher-03',
    displayName: 'Docente demo 03',
    staffCode: 'PER-DOC-03',
    role: 'teacher',
    area: 'languages',
    areaLabel: 'Idiomas',
    assignmentId: 'course-english-11b',
    assignmentLabel: 'Inglés B2 · 11B',
    status: 'active',
    workload: 'balanced',
    workloadLabel: '2 grupos asignados',
    nextAction: 'Mantener seguimiento',
  },
  {
    id: 'staff-demo-assistant-04',
    displayName: 'Asistente demo 04',
    staffCode: 'PER-ASI-04',
    role: 'assistant',
    area: 'sciences',
    areaLabel: 'Ciencias',
    assignmentId: 'course-science-6a',
    assignmentLabel: 'Ciencias Integradas · 6A',
    status: 'follow_up',
    workload: 'available',
    workloadLabel: 'Disponibilidad parcial',
    nextAction: 'Confirmar cobertura mock',
  },
  {
    id: 'staff-demo-teacher-05',
    displayName: 'Docente demo 05',
    staffCode: 'PER-DOC-05',
    role: 'teacher',
    area: 'humanities',
    areaLabel: 'Humanidades',
    assignmentId: 'course-history-9c',
    assignmentLabel: 'Historia Contemporánea · 9C',
    status: 'follow_up',
    workload: 'review',
    workloadLabel: 'Planificación pendiente',
    nextAction: 'Validar carga del período',
  },
  {
    id: 'staff-demo-assistant-06',
    displayName: 'Asistente demo 06',
    staffCode: 'PER-ASI-06',
    role: 'assistant',
    area: 'technology',
    areaLabel: 'Tecnología',
    assignmentId: 'course-technology-8a',
    assignmentLabel: 'Tecnología Aplicada · 8A',
    status: 'inactive',
    workload: 'available',
    workloadLabel: 'Sin asignación activa',
    nextAction: 'Revisar continuidad mock',
  },
] as const satisfies readonly StaffV2ListItem[];

export const EMPTY_STAFF_V2: StaffV2Fixture = {
  summary: {
    activeStaff: 0,
    teachers: 0,
    assistants: 0,
    pendingInvitations: 0,
  },
  staff: [],
  workload: [],
  invitations: [],
  disclaimer: 'Consola mock sin gestión real de usuarios',
};

export function getMockStaffV2(roleKey: RoleKey): StaffV2Fixture {
  if (roleKey !== 'owner' && roleKey !== 'admin') {
    return EMPTY_STAFF_V2;
  }

  return {
    summary: {
      activeStaff: staff.filter((person) => person.status === 'active').length,
      teachers: staff.filter((person) => person.role === 'teacher').length,
      assistants: staff.filter((person) => person.role === 'assistant').length,
      pendingInvitations: 2,
    },
    staff,
    workload: [
      {
        id: 'workload-sciences',
        areaLabel: 'Ciencias',
        assignedPeople: 2,
        assignedGroups: 4,
        statusLabel: 'Revisión recomendada',
      },
      {
        id: 'workload-languages',
        areaLabel: 'Idiomas',
        assignedPeople: 1,
        assignedGroups: 2,
        statusLabel: 'Cobertura estable',
      },
      {
        id: 'workload-humanities',
        areaLabel: 'Humanidades',
        assignedPeople: 1,
        assignedGroups: 1,
        statusLabel: 'Planificación mock',
      },
    ],
    invitations: [
      {
        id: 'invitation-preview-sciences',
        roleLabel: 'Docente',
        areaLabel: 'Ciencias',
        requestedLabel: 'Esta semana',
        statusLabel: 'Pendiente mock',
      },
      {
        id: 'invitation-preview-technology',
        roleLabel: 'Asistente',
        areaLabel: 'Tecnología',
        requestedLabel: 'Semana anterior',
        statusLabel: 'Revisión mock',
      },
    ],
    disclaimer:
      'Personal, carga e invitaciones mock · sin cambios persistentes',
  };
}
