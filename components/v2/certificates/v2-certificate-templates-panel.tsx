import { LayoutTemplate } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { CertificateV2Template } from '@/lib/types/certificates-v2';

export function V2CertificateTemplatesPanel({
  templates,
}: {
  templates: readonly CertificateV2Template[];
}) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="templates-title">
      <div className="border-b px-4 py-3">
        <h2 id="templates-title" className="flex items-center gap-2 font-semibold">
          <LayoutTemplate className="h-4 w-4 text-primary" aria-hidden />
          Plantillas mock
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Referencias visuales sin archivos ni documentos generados.
        </p>
      </div>
      <ul className="divide-y">
        {templates.map((template) => (
          <li key={template.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{template.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{template.detail}</p>
            </div>
            <Badge variant="outline">{template.statusLabel}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
