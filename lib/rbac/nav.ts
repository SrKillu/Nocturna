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

/**
 * Canonical navigation — single source of truth for both the desktop sidebar
 * and the mobile drawer. Adding a new top-level module means appending a row
 * here.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/courses',      label: 'Cursos',         icon: BookOpen },
  { href: '/tasks',        label: 'Tareas',         icon: ClipboardList },
  { href: '/submissions',  label: 'Entregas',       icon: FileUp },
  { href: '/grades',       label: 'Calificaciones', icon: GraduationCap },
  {
    href: '/admin',
    label: 'Admin',
    icon: ShieldCheck,
    roles: ['admin', 'super_admin'],
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
