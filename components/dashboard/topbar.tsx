'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function DashboardTopbar({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur">
      <div className="text-sm text-muted-foreground">Panel</div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
        <Button size="sm" variant="outline" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" /> Salir
        </Button>
      </div>
    </header>
  );
}
