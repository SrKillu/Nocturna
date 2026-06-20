import { Badge } from '@/components/ui/badge';
import type { ReportV2Category } from '@/lib/types/reports-v2';

const labels: Record<ReportV2Category, string> = {
  attendance: 'Asistencia',
  performance: 'Rendimiento',
  risk: 'Riesgo',
  evaluations: 'Evaluaciones',
  materials: 'Materiales',
  activity: 'Actividad',
  progress: 'Progreso',
};
export function V2ReportTypeBadge({ category }: { category: ReportV2Category }) {
  return <Badge variant="outline">{labels[category]}</Badge>;
}
