'use client';

import { useState } from 'react';
import { Loader2, LogOut, Menu, UserRound } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActiveInstitutionSwitcher } from '@/components/v2/layout/active-institution-switcher';
import { apiFetch } from '@/lib/api/client';
import { createClient } from '@/lib/supabase/client';
import type {
  ActiveMembershipContext,
  MembershipSummary,
  ProfileSummary,
} from '@/lib/types/auth';

interface V2TopbarProps {
  profile: ProfileSummary;
  memberships: MembershipSummary[];
  activeMembership: ActiveMembershipContext;
  onOpenNavigation: () => void;
}

export function V2Topbar({
  profile,
  memberships,
  activeMembership,
  onOpenNavigation,
}: V2TopbarProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout(): Promise<void> {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const supabase = createClient();
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ scope: 'local' }),
    }).catch(() => undefined);
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    window.location.assign('/login');
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Abrir navegación"
        onClick={onOpenNavigation}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>

      <ActiveInstitutionSwitcher
        memberships={memberships}
        activeMembership={activeMembership}
      />

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Abrir menú de usuario"
            >
              <UserRound className="h-5 w-5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <span className="block truncate">{profile.fullName ?? 'Cuenta Nocturna'}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {profile.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={isLoggingOut} onSelect={logout}>
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden />
              )}
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
