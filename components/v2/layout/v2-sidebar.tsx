'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { navGroupsForCapabilities } from '@/lib/rbac/nav-v2';
import type {
  Capabilities,
  MembershipSummary,
  ProfileSummary,
  RoleKey,
} from '@/lib/types/auth';

interface V2SidebarProps {
  profile: ProfileSummary;
  activeMembership: MembershipSummary;
  capabilities: Capabilities;
  onNavigate?: () => void;
}

const roleLabels: Record<RoleKey, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  teacher: 'Docente',
  assistant: 'Asistente',
  student: 'Estudiante',
  guardian: 'Encargado',
  support: 'Soporte',
};

export function V2Sidebar(props: V2SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r bg-sidebar lg:block">
      <V2SidebarContent {...props} />
    </aside>
  );
}

export function V2SidebarContent({
  profile,
  activeMembership,
  capabilities,
  onNavigate,
}: V2SidebarProps) {
  const pathname = usePathname();
  const groups = navGroupsForCapabilities(capabilities);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <Link
          href="/v2/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 font-semibold text-sidebar-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Moon className="h-4 w-4" aria-hidden />
          </span>
          <span>Nocturna</span>
          <span className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            V2
          </span>
        </Link>
      </div>

      <div className="border-b px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Institución
        </p>
        <p className="mt-1 truncate text-sm font-medium text-sidebar-foreground">
          {activeMembership.institutionName}
        </p>
        <p className="mt-0.5 text-xs capitalize text-muted-foreground">
          {roleLabels[activeMembership.roleKey]}
        </p>
      </div>

      <nav className="flex-1 space-y-6 px-3 py-4" aria-label="Navegación V2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
                      )}
                    >
                      {active ? (
                        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />
                      ) : null}
                      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t px-5 py-4">
        <p className="truncate text-sm font-medium text-sidebar-foreground">
          {profile.fullName ?? profile.email}
        </p>
        <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
      </div>
    </div>
  );
}
