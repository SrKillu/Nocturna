'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, LogOut, Menu, Sparkles } from 'lucide-react';
import type { AppShellUser } from '@/components/layout/app-shell';
import { ThemeToggle } from '@/components/theme-toggle';

interface TopbarProps {
  user: AppShellUser;
  onOpenMobileNav: () => void;
}

function getInitials(user: AppShellUser): string {
  const source = user.fullName?.trim() || user.email;
  if (!source) return '•';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

const PAGE_TITLES: Array<{ match: RegExp; title: string }> = [
  { match: /^\/dashboard/,    title: 'Panel' },
  { match: /^\/courses\/[^/]+/, title: 'Curso' },
  { match: /^\/courses/,      title: 'Cursos' },
  { match: /^\/tasks\/[^/]+/, title: 'Tarea' },
  { match: /^\/tasks/,        title: 'Tareas' },
  { match: /^\/submissions/,  title: 'Entregas' },
  { match: /^\/grades/,       title: 'Calificaciones' },
  { match: /^\/admin/,        title: 'Administración' },
];

function resolveTitle(pathname: string): string {
  for (const row of PAGE_TITLES) if (row.match.test(pathname)) return row.title;
  return 'Nocturna';
}

export function Topbar({ user, onOpenMobileNav }: TopbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const displayName = user.fullName?.trim() || user.email.split('@')[0];
  const title = resolveTitle(pathname);
  const canCreate = user.role !== 'student';

  async function logout(scope: 'local' | 'global') {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope }),
      }).catch(() => undefined);
      const supabase = createClient();
      await supabase.auth.signOut({ scope }).catch(() => undefined);
    } finally {
      setBusy(false);
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-card/80 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground md:inline">
            Nocturna
          </span>
          <span aria-hidden className="hidden text-muted-foreground/50 md:inline">/</span>
          <h1 className="text-sm font-semibold tracking-tight">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {canCreate ? (
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link href={user.role === 'teacher' ? '/tasks' : '/courses'}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {user.role === 'teacher' ? 'Nueva tarea' : 'Nuevo curso'}
            </Link>
          </Button>
        ) : null}
        <ThemeToggle />
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium leading-none">{displayName}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full p-0"
              aria-label="Menú de usuario"
              disabled={busy}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(user)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout('local')} disabled={busy}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout('global')} disabled={busy}>
              <Globe className="mr-2 h-4 w-4" /> Cerrar en todos los dispositivos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
