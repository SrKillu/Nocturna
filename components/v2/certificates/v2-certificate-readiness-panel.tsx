import { CheckCircle2, ClipboardList } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { CertificateV2ReadinessItem } from '@/lib/types/certificates-v2';

export function V2CertificateReadinessPanel({
  items,
}: {
  items: readonly CertificateV2ReadinessItem[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="readiness-title">
      <div className="border-b px-4 py-3">
        <h2 id="readiness-title" className="flex items-center gap-2 font-semibold">
          <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
          Preparación y elegibilidad
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Señales mock que siempre requieren validación humana.
        </p>
      </div>
      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden />
                {item.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <Badge variant={item.status === 'complete' ? 'secondary' : 'outline'}>
              {item.status === 'complete' ? 'Completo' : 'Revisar'}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
