import type { UserRole } from '@/lib/types/database';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileUp,
  GraduationCap,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: readonly UserRole[]; // omit → visible to every authenticated role
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Canonical navigation — single source of truth for both the desktop sidebar
 * and the mobile drawer. Grouped à la Teams: primary workspace + privileged
 * actions separated visually.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard',    label: 'Panel',          icon: LayoutDashboard },
  { href: '/courses',      label: 'Cursos',         icon: BookOpen },
  { href: '/tasks',        label: 'Tareas',         icon: ClipboardList },
  { href: '/submissions',  label: 'Entregas',       icon: FileUp },
  { href: '/grades',       label: 'Calificaciones', icon: GraduationCap },
  {
    href: '/admin',
    label: 'Administración',
    icon: ShieldCheck,
    roles: ['admin', 'super_admin'],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

export function navGroupsForRole(role: UserRole): NavGroup[] {
  const all = navItemsForRole(role);
  const primary = all.filter((i) => !i.roles);
  const privileged = all.filter((i) => i.roles);
  const groups: NavGroup[] = [{ label: 'Espacio', items: primary }];
  if (privileged.length > 0) groups.push({ label: 'Gestión', items: privileged });
  return groups;
}
