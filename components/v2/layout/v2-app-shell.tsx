'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import { TenantContextStrip } from '@/components/v2/layout/tenant-context-strip';
import { V2MobileSidebar } from '@/components/v2/layout/v2-mobile-sidebar';
import { V2Sidebar } from '@/components/v2/layout/v2-sidebar';
import { V2Topbar } from '@/components/v2/layout/v2-topbar';
import type {
  ActiveMembershipContext,
  MembershipSummary,
  ProfileSummary,
} from '@/lib/types/auth';

interface V2AppShellProps {
  children: ReactNode;
  profile: ProfileSummary;
  memberships: MembershipSummary[];
  activeMembership: ActiveMembershipContext;
  activeMembershipSummary: MembershipSummary;
}

export function V2AppShell({
  children,
  profile,
  memberships,
  activeMembership,
  activeMembershipSummary,
}: V2AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <V2Sidebar
        profile={profile}
        activeMembership={activeMembershipSummary}
        capabilities={activeMembership.capabilities}
      />
      <V2MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        profile={profile}
        activeMembership={activeMembershipSummary}
        capabilities={activeMembership.capabilities}
      />

      <div className="min-w-0 flex-1">
        <V2Topbar
          profile={profile}
          memberships={memberships}
          activeMembership={activeMembership}
          onOpenNavigation={() => setMobileOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
          <TenantContextStrip
            activeMembership={activeMembership}
            membership={activeMembershipSummary}
          />
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
