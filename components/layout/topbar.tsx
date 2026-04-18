'use client';

import { useState } from 'react';
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
import { Globe, LogOut, Menu } from 'lucide-react';
import type { AppShellUser } from '@/components/layout/app-shell';

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

export function Topbar({ user, onOpenMobileNav }: TopbarProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const displayName = user.fullName?.trim() || user.email.split('@')[0];

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
      <div className="flex items-center gap-2">
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
        <span className="text-sm text-muted-foreground">Panel</span>
      </div>

      <div className="flex items-center gap-3">
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
