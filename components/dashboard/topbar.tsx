'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Globe } from 'lucide-react';

export function DashboardTopbar({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout(scope: 'local' | 'global') {
    if (busy) return;
    setBusy(true);
    try {
      // Best-effort server-side revoke first (handles scope=global).
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope }),
      });
      const supabase = createClient();
      await supabase.auth.signOut({ scope });
    } finally {
      setBusy(false);
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur">
      <div className="text-sm text-muted-foreground">Panel</div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={busy}>
              <LogOut className="mr-2 h-4 w-4" /> Salir
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => logout('local')} disabled={busy}>
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout('global')} disabled={busy}>
              <Globe className="mr-2 h-4 w-4" /> Cerrar en todos los dispositivos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
