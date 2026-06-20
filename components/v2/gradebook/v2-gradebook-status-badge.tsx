import { Badge } from '@/components/ui/badge';
import type { GradebookV2Status, GradebookV2Trend } from '@/lib/types/gradebook-v2';

const statusLabels: Record<GradebookV2Status, string> = {
  on_track: 'Al día',
  watch: 'Atención',
  risk: 'En riesgo',
  pending: 'Pendiente',
};

const trendLabels: Record<GradebookV2Trend, string> = {
  up: 'Al alza',
  stable: 'Estable',
  down: 'A la baja',
};

export function V2GradebookStatusBadge({ status }: { status: GradebookV2Status }) {
  return (
    <Badge variant={status === 'risk' ? 'destructive' : 'outline'}>
      {statusLabels[status]}
    </Badge>
  );
}

export function V2GradebookTrendBadge({ trend }: { trend: GradebookV2Trend }) {
  return <Badge variant="outline">{trendLabels[trend]}</Badge>;
}
