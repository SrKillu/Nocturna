import type { UserRole } from '@/lib/types/database';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileUp,
  GraduationCap,
  ShieldCheck,
  Users2,
  FolderArchive,
  MessageSquare,
  QrCode,
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
    href: '/teachers',
    label: 'Profesores',
    icon: Users2,
    roles: ['admin', 'super_admin'],
  },
  { href: '/materials',    label: 'Materiales',     icon: FolderArchive },
  { href: '/chat',         label: 'Chat',           icon: MessageSquare },
  {
    href: '/invites',
    label: 'Invitaciones',
    icon: QrCode,
    roles: ['admin', 'super_admin', 'teacher'],
  },
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

/**
 * Two visual groups:
 *   1. "Espacio"  → trabajo diario (cursos, tareas, materiales, chat, …)
 *   2. "Gestión"  → solo staff (profesores, administración)
 *
 * Un item con `roles` configurado se considera privilegiado SOLO si es
 * exclusivo de admin/super_admin. Materiales / Chat / Invitaciones siguen
 * en "Espacio" aunque tengan filtro por rol, porque forman parte del flujo
 * diario de los usuarios (no son tareas administrativas).
 */
const ESPACIO_HREFS = new Set<string>([
  '/dashboard',
  '/courses',
  '/tasks',
  '/submissions',
  '/grades',
  '/materials',
  '/chat',
  '/invites',
]);

export function navGroupsForRole(role: UserRole): NavGroup[] {
  const all = navItemsForRole(role);
  const primary = all.filter((i) => ESPACIO_HREFS.has(i.href));
  const privileged = all.filter((i) => !ESPACIO_HREFS.has(i.href));
  const groups: NavGroup[] = [{ label: 'Espacio', items: primary }];
  if (privileged.length > 0) groups.push({ label: 'Gestión', items: privileged });
  return groups;
}
