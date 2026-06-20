import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { V2ReportStatusBadge } from '@/components/v2/reports/v2-report-status-badge';
import { V2ReportTypeBadge } from '@/components/v2/reports/v2-report-type-badge';
import type { ReportV2ListItem } from '@/lib/types/reports-v2';

export function V2ReportsTable({ reports }: { reports: readonly ReportV2ListItem[] }) {
  return (
    <div className="hidden overflow-hidden rounded-md border bg-card lg:block">
      <Table>
        <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead className="px-4">Reporte</TableHead><TableHead>Categoría</TableHead><TableHead>Alcance</TableHead><TableHead>Período</TableHead><TableHead>Estado</TableHead><TableHead>Actualización</TableHead><TableHead className="pr-4">Próxima acción</TableHead></TableRow></TableHeader>
        <TableBody>{reports.map((report) => <TableRow key={report.id}><TableCell className="px-4 py-3 font-medium">{report.title}</TableCell><TableCell><V2ReportTypeBadge category={report.category} /></TableCell><TableCell>{report.scopeLabel}</TableCell><TableCell className="text-sm text-muted-foreground">{report.periodLabel}</TableCell><TableCell><V2ReportStatusBadge status={report.status} /></TableCell><TableCell className="text-sm text-muted-foreground">{report.updatedLabel}</TableCell><TableCell className="pr-4 text-sm text-muted-foreground">{report.nextAction}</TableCell></TableRow>)}</TableBody>
      </Table>
    </div>
  );
}
