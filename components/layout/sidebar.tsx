'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navGroupsForRole } from '@/lib/rbac/nav';
import { roleLabel } from '@/lib/rbac/labels';
import type { AppShellUser } from '@/components/layout/app-shell';

interface SidebarProps {
  user: AppShellUser;
  institutionName: string | null;
  onNavigate?: () => void;
}

/**
 * Desktop sidebar (hidden on mobile – `MobileSidebar` mirrors this in a Sheet).
 *   * Fixed width, sticky on the viewport’s left.
 *   * Single flat navigation — the “Admin” entry only appears for admin roles.
 */
export function Sidebar({ user, institutionName, onNavigate }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-sidebar md:block">
      <SidebarInner user={user} institutionName={institutionName} onNavigate={onNavigate} />
    </aside>
  );
}

export function SidebarInner({ user, institutionName, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const groups = navGroupsForRole(user.role);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 font-semibold text-sidebar-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Moon className="h-4 w-4" />
          </span>
          <span>Nocturna</span>
        </Link>
      </div>

      <div className="border-b px-5 py-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Institución</p>
        <p className="mt-1 truncate text-sm font-medium text-sidebar-foreground">
          {institutionName ?? '—'}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">Rol: {roleLabel(user.role)}</p>
      </div>

      <nav className="flex-1 space-y-6 px-3 py-4" aria-label="Main navigation">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      )}
                    >
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute inset-y-1.5 -left-1 w-1 rounded-full bg-primary"
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-colors',
                          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                        aria-hidden
                      />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t px-5 py-4 text-xs text-muted-foreground">
        <p className="truncate font-medium text-foreground" suppressHydrationWarning>
          {user.fullName ?? user.email}
        </p>
        <p className="truncate" suppressHydrationWarning>{user.email}</p>
      </div>
    </div>
  );
}
