import { CalendarClock, ClipboardCheck, LayoutTemplate, UsersRound } from 'lucide-react';

import type { CertificatesV2Summary } from '@/lib/types/certificates-v2';

export function V2CertificatesSummary({
  summary,
}: {
  summary: CertificatesV2Summary;
}) {
  const metrics = [
    [
      'Certificados pendientes',
      String(summary.pendingCertificates),
      'Registros mock',
      CalendarClock,
    ],
    [
      'Estudiantes elegibles',
      String(summary.eligibleStudents),
      'Elegibilidad simulada',
      UsersRound,
    ],
    [
      'Plantillas disponibles',
      String(summary.availableTemplates),
      'Sin documentos generados',
      LayoutTemplate,
    ],
    [
      'Última revisión',
      summary.lastReviewLabel,
      'Validación mock',
      ClipboardCheck,
    ],
  ] as const;

  return (
    <section
      className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      aria-label="Resumen de certificados"
    >
      {metrics.map(([label, value, detail, Icon]) => (
        <article key={label} className="rounded-md border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          </div>
          <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </article>
      ))}
    </section>
  );
}
