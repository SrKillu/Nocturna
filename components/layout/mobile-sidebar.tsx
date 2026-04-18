'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { SidebarInner } from '@/components/layout/sidebar';
import type { AppShellUser } from '@/components/layout/app-shell';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppShellUser;
  institutionName: string | null;
}

/**
 * Responsive drawer version of the sidebar, driven by the topbar’s hamburger.
 * Uses the same `SidebarInner` component so navigation items never drift.
 */
export function MobileSidebar({
  open,
  onOpenChange,
  user,
  institutionName,
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Menú de navegación</SheetTitle>
          <SheetDescription>Accede a las distintas secciones de Nocturna.</SheetDescription>
        </SheetHeader>
        <SidebarInner
          user={user}
          institutionName={institutionName}
          onNavigate={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
