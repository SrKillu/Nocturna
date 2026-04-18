'use client';

import * as React from 'react';
import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import type { UserRole } from '@/lib/types/database';

export interface AppShellUser {
  email: string;
  fullName: string | null;
  role: UserRole;
}

interface AppShellProps {
  user: AppShellUser;
  institutionName: string | null;
  children: React.ReactNode;
}

/**
 * Composition root of the authenticated shell. Keeps the responsive behaviour
 * (mobile drawer) out of the server layout and lets the sidebar / topbar stay
 * as pure presentational clients.
 */
export function AppShell({ user, institutionName, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar user={user} institutionName={institutionName} />
      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        user={user}
        institutionName={institutionName}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar user={user} onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
