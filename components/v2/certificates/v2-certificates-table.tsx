import { V2CertificateEligibilityBadge, V2CertificateStatusBadge } from '@/components/v2/certificates/v2-certificate-status-badge';
import { V2CertificateTypeBadge } from '@/components/v2/certificates/v2-certificate-type-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CertificateV2ListItem } from '@/lib/types/certificates-v2';

export function V2CertificatesTable({
  certificates,
}: {
  certificates: readonly CertificateV2ListItem[];
}) {
  return (
    <div className="hidden overflow-hidden rounded-md border bg-card lg:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-4">Estudiante o grupo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Curso / sección</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Elegibilidad</TableHead>
            <TableHead className="pr-4">Próxima acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {certificates.map((certificate) => (
            <TableRow key={certificate.id}>
              <TableCell className="px-4 py-3">
                <p className="font-medium">{certificate.recipientLabel}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {certificate.recipientCode}
                </p>
              </TableCell>
              <TableCell>
                <V2CertificateTypeBadge type={certificate.type} />
              </TableCell>
              <TableCell>
                {certificate.courseLabel} · {certificate.sectionLabel}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {certificate.periodLabel}
              </TableCell>
              <TableCell>
                <V2CertificateStatusBadge status={certificate.status} />
              </TableCell>
              <TableCell>
                <V2CertificateEligibilityBadge
                  eligibility={certificate.eligibility}
                />
              </TableCell>
              <TableCell className="pr-4 text-sm text-muted-foreground">
                {certificate.nextAction}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
