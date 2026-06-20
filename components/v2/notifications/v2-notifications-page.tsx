'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { V2NotificationsDigestPanel } from '@/components/v2/notifications/v2-notifications-digest-panel';
import { V2NotificationsEmptyState } from '@/components/v2/notifications/v2-notifications-empty-state';
import { V2NotificationsFilters } from '@/components/v2/notifications/v2-notifications-filters';
import { V2NotificationsHeader } from '@/components/v2/notifications/v2-notifications-header';
import { V2NotificationsMobileList } from '@/components/v2/notifications/v2-notifications-mobile-list';
import { V2NotificationsPreferencesPanel } from '@/components/v2/notifications/v2-notifications-preferences-panel';
import { V2NotificationsSummary } from '@/components/v2/notifications/v2-notifications-summary';
import { V2NotificationsTable } from '@/components/v2/notifications/v2-notifications-table';
import { filterNotificationsV2, type NotificationsV2FilterState, type NotificationsV2Fixture } from '@/lib/types/notifications-v2';

const initialFilters: NotificationsV2FilterState = { query: '', module: 'all', type: 'all', priority: 'all', status: 'all', channel: 'all', period: 'all' };

export function V2NotificationsPage({ notifications }: { notifications: NotificationsV2Fixture }) {
  const [filters, setFilters] = useState(initialFilters);
  const filtered = useMemo(() => filterNotificationsV2(notifications.notifications, filters), [notifications.notifications, filters]);
  const hasFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key as keyof NotificationsV2FilterState]);
  return <div className="space-y-5"><V2NotificationsHeader /><V2NotificationsSummary summary={notifications.summary} /><V2NotificationsFilters filters={filters} onChange={setFilters} /><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><p className="text-muted-foreground"><span className="font-medium text-foreground">{filtered.length}</span> {filtered.length === 1 ? 'notificación visible' : 'notificaciones visibles'}</p><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="h-4 w-4" aria-hidden />{notifications.disclaimer}</span></div>{filtered.length === 0 ? <div className="rounded-md border bg-card p-4"><V2NotificationsEmptyState filtered={hasFilters} /></div> : <><V2NotificationsTable notifications={filtered} /><V2NotificationsMobileList notifications={filtered} /></>}<div className="grid gap-5 lg:grid-cols-2"><V2NotificationsDigestPanel digest={notifications.digest} /><V2NotificationsPreferencesPanel preferences={notifications.preferences} /></div></div>;
}
