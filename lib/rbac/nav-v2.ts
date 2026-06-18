import { LayoutDashboard, type LucideIcon } from 'lucide-react';
import type { Capabilities, CapabilityKey } from '@/lib/types/auth';

export type V2NavAvailability = 'active' | 'planned';
export type V2CapabilityMode = 'all' | 'any';

export interface V2NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: 'Inicio';
  requiredCapabilities: readonly CapabilityKey[];
  capabilityMode: V2CapabilityMode;
  availability: V2NavAvailability;
}

export interface V2NavGroup {
  label: string;
  items: V2NavItem[];
}

const NAV_ITEMS_V2: readonly V2NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/v2/dashboard',
    icon: LayoutDashboard,
    group: 'Inicio',
    requiredCapabilities: [],
    capabilityMode: 'all',
    availability: 'active',
  },
];

function hasRequiredCapabilities(item: V2NavItem, capabilities: Capabilities): boolean {
  if (item.requiredCapabilities.length === 0) return true;
  const checks = item.requiredCapabilities.map((key) => capabilities[key] === true);
  return item.capabilityMode === 'all' ? checks.every(Boolean) : checks.some(Boolean);
}

export function navGroupsForCapabilities(capabilities: Capabilities): V2NavGroup[] {
  const visible = NAV_ITEMS_V2.filter(
    (item) =>
      item.availability === 'active' &&
      hasRequiredCapabilities(item, capabilities)
  );

  return visible.length > 0 ? [{ label: 'Inicio', items: visible }] : [];
}
