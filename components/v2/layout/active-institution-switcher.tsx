'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiFetch } from '@/lib/api/client';
import type { ActiveMembershipContext, MembershipSummary } from '@/lib/types/auth';

interface ActiveInstitutionSwitcherProps {
  memberships: MembershipSummary[];
  activeMembership: ActiveMembershipContext;
}

function isSelectable(membership: MembershipSummary): boolean {
  return (
    membership.status === 'active' &&
    (membership.institutionStatus === 'active' || membership.institutionStatus === 'trial')
  );
}

export function ActiveInstitutionSwitcher({
  memberships,
  activeMembership,
}: ActiveInstitutionSwitcherProps) {
  const router = useRouter();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const active = memberships.find(
    (membership) => membership.membershipId === activeMembership.membershipId
  );
  const selectable = memberships.filter(isSelectable);
  const unavailable = memberships.filter((membership) => !isSelectable(membership));

  async function switchMembership(membershipId: string): Promise<void> {
    if (membershipId === activeMembership.membershipId || switchingId) return;
    setSwitchingId(membershipId);

    try {
      const response = await apiFetch('/api/memberships/active', {
        method: 'POST',
        body: JSON.stringify({ membershipId }),
      });

      if (!response.ok) {
        toast.error('No se pudo cambiar de institución');
        return;
      }

      toast.success('Institución activa actualizada');
      startTransition(() => router.refresh());
    } catch {
      toast.error('No se pudo cambiar de institución');
    } finally {
      setSwitchingId(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 max-w-[240px] justify-start gap-2 px-2 sm:max-w-[320px]"
          disabled={isRefreshing}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Building2 className="h-4 w-4 text-primary" aria-hidden />
            )}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium">
              {active?.institutionName ?? 'Institución activa'}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {active?.roleKey ?? activeMembership.roleKey}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Espacios disponibles</DropdownMenuLabel>
        {selectable.map((membership) => {
          const selected = membership.membershipId === activeMembership.membershipId;
          const switching = switchingId === membership.membershipId;
          return (
            <DropdownMenuItem
              key={membership.membershipId}
              disabled={selected || Boolean(switchingId)}
              onSelect={() => switchMembership(membership.membershipId)}
              className="items-start py-2.5"
            >
              <Building2 className="mt-0.5 h-4 w-4" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{membership.institutionName}</span>
                <span className="block text-xs text-muted-foreground">
                  {membership.roleKey} · {membership.institutionStatus}
                </span>
              </span>
              {selected ? <Check className="mt-0.5 h-4 w-4 text-primary" aria-hidden /> : null}
              {switching ? <Loader2 className="mt-0.5 h-4 w-4 animate-spin" aria-hidden /> : null}
            </DropdownMenuItem>
          );
        })}
        {unavailable.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              No disponibles
            </DropdownMenuLabel>
            {unavailable.map((membership) => (
              <DropdownMenuItem
                key={membership.membershipId}
                disabled
                className="items-start py-2.5"
              >
                <Building2 className="mt-0.5 h-4 w-4" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{membership.institutionName}</span>
                  <span className="block text-xs">
                    {membership.roleKey} · {membership.status}
                  </span>
                </span>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
