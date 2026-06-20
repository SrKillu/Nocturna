import {
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Library,
  ScrollText,
  UserCog,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import type { Capabilities, CapabilityKey, RoleKey } from '@/lib/types/auth';

export type V2NavAvailability = 'active' | 'planned';
export type V2CapabilityMode = 'all' | 'any';
export type V2NavGroupLabel = 'Inicio' | 'Académico';

export interface V2NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: V2NavGroupLabel;
  requiredCapabilities: readonly CapabilityKey[];
  excludedCapabilities?: readonly CapabilityKey[];
  requiredRoles?: readonly RoleKey[];
  capabilityMode: V2CapabilityMode;
  availability: V2NavAvailability;
}

export interface V2NavGroup {
  label: string;
  items: V2NavItem[];
}

const NAV_ITEMS_V2: readonly V2NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/v2/dashboard',
    icon: LayoutDashboard,
    group: 'Inicio',
    requiredCapabilities: [],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'courses',
    label: 'Cursos',
    href: '/v2/courses',
    icon: BookOpenCheck,
    group: 'Académico',
    requiredCapabilities: ['canManageCourses', 'canGrade', 'canSubmit'],
    capabilityMode: 'any',
    availability: 'active',
  },
  {
    id: 'students',
    label: 'Estudiantes',
    href: '/v2/students',
    icon: UsersRound,
    group: 'Académico',
    requiredCapabilities: ['canManageCourses', 'canGrade'],
    capabilityMode: 'any',
    availability: 'active',
  },
  {
    id: 'enrollments',
    label: 'Matrículas',
    href: '/v2/enrollments',
    icon: ClipboardList,
    group: 'Académico',
    requiredCapabilities: ['canManageCourses'],
    requiredRoles: ['owner', 'admin'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'staff',
    label: 'Personal',
    href: '/v2/staff',
    icon: UserCog,
    group: 'Académico',
    requiredCapabilities: ['canManageUsers'],
    requiredRoles: ['owner', 'admin'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'attendance',
    label: 'Asistencia',
    href: '/v2/attendance',
    icon: CalendarCheck,
    group: 'Académico',
    requiredCapabilities: ['canManageAttendance'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'schedule',
    label: 'Horarios',
    href: '/v2/schedule',
    icon: CalendarDays,
    group: 'Académico',
    requiredCapabilities: ['canManageAttendance'],
    requiredRoles: ['owner', 'admin', 'teacher', 'assistant'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'evaluations',
    label: 'Evaluaciones',
    href: '/v2/evaluations',
    icon: ClipboardCheck,
    group: 'Académico',
    requiredCapabilities: ['canGrade'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'gradebook',
    label: 'Libro de notas',
    href: '/v2/gradebook',
    icon: ChartNoAxesColumnIncreasing,
    group: 'Académico',
    requiredCapabilities: ['canGrade'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'reports',
    label: 'Reportes',
    href: '/v2/reports',
    icon: BarChart3,
    group: 'Académico',
    requiredCapabilities: ['canViewReports'],
    requiredRoles: ['owner', 'admin', 'teacher', 'assistant'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'certificates',
    label: 'Certificados',
    href: '/v2/certificates',
    icon: ScrollText,
    group: 'Académico',
    requiredCapabilities: ['canManageCertificates'],
    requiredRoles: ['owner', 'admin'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'materials',
    label: 'Materiales',
    href: '/v2/materials',
    icon: Library,
    group: 'Académico',
    requiredCapabilities: ['canManageMaterials'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'my-space',
    label: 'Mi espacio',
    href: '/v2/my-space',
    icon: GraduationCap,
    group: 'Académico',
    requiredCapabilities: ['canSubmit'],
    excludedCapabilities: ['canManageInstitution', 'canManageCourses', 'canGrade'],
    capabilityMode: 'all',
    availability: 'active',
  },
  {
    id: 'guardian-space',
    label: 'Espacio del encargado',
    href: '/v2/guardian-space',
    icon: HeartHandshake,
    group: 'Académico',
    requiredCapabilities: ['canViewReports'],
    requiredRoles: ['guardian'],
    capabilityMode: 'all',
    availability: 'active',
  },
];

function hasRequiredCapabilities(
  item: V2NavItem,
  capabilities: Capabilities,
  roleKey?: RoleKey
): boolean {
  if (item.requiredRoles && (!roleKey || !item.requiredRoles.includes(roleKey))) {
    return false;
  }
  if (
    item.excludedCapabilities?.some((key) => capabilities[key] === true)
  ) {
    return false;
  }
  if (item.requiredCapabilities.length === 0) return true;
  const checks = item.requiredCapabilities.map((key) => capabilities[key] === true);
  return item.capabilityMode === 'all' ? checks.every(Boolean) : checks.some(Boolean);
}

export function navGroupsForCapabilities(
  capabilities: Capabilities,
  roleKey?: RoleKey
): V2NavGroup[] {
  const visible = NAV_ITEMS_V2.filter(
    (item) =>
      item.availability === 'active' &&
      hasRequiredCapabilities(item, capabilities, roleKey)
  );

  const groupOrder: readonly V2NavGroupLabel[] = ['Inicio', 'Académico'];
  return groupOrder.flatMap((label) => {
    const items = visible.filter((item) => item.group === label);
    return items.length > 0 ? [{ label, items }] : [];
  });
}
