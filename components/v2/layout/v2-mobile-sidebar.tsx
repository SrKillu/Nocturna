'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { V2SidebarContent } from '@/components/v2/layout/v2-sidebar';
import type { Capabilities, MembershipSummary, ProfileSummary } from '@/lib/types/auth';

interface V2MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileSummary;
  activeMembership: MembershipSummary;
  capabilities: Capabilities;
}

export function V2MobileSidebar({
  open,
  onOpenChange,
  profile,
  activeMembership,
  capabilities,
}: V2MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navegación Nocturna V2</SheetTitle>
          <SheetDescription>Accede a las secciones disponibles.</SheetDescription>
        </SheetHeader>
        <V2SidebarContent
          profile={profile}
          activeMembership={activeMembership}
          capabilities={capabilities}
          onNavigate={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
