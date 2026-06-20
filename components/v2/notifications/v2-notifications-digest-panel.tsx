import { ListChecks } from 'lucide-react';
import type { NotificationV2DigestItem } from '@/lib/types/notifications-v2';

export function V2NotificationsDigestPanel({ digest }: { digest: readonly NotificationV2DigestItem[] }) {
  return <section className="rounded-md border bg-card" aria-labelledby="notifications-digest-title"><div className="border-b px-4 py-3"><h2 id="notifications-digest-title" className="flex items-center gap-2 font-semibold"><ListChecks className="h-4 w-4 text-primary" aria-hidden />Digest mock</h2><p className="mt-0.5 text-sm text-muted-foreground">Resumen local sin envíos ni procesamiento real.</p></div><ul className="divide-y">{digest.map((item) => <li key={item.id} className="px-4 py-3"><p className="text-sm font-medium">{item.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p></li>)}</ul></section>;
}
