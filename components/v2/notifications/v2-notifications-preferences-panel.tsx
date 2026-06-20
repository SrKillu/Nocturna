import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { NotificationV2Preference } from '@/lib/types/notifications-v2';

export function V2NotificationsPreferencesPanel({ preferences }: { preferences: readonly NotificationV2Preference[] }) {
  return <section className="rounded-md border bg-card" aria-labelledby="notifications-preferences-title"><div className="border-b px-4 py-3"><h2 id="notifications-preferences-title" className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden />Preferencias</h2><p className="mt-0.5 text-sm text-muted-foreground">Vista visual sin guardado o suscripciones reales.</p></div><ul className="divide-y">{preferences.map((preference) => <li key={preference.id} className="flex items-start justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium">{preference.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{preference.detail}</p></div><Badge variant="outline">{preference.value}</Badge></li>)}</ul></section>;
}
