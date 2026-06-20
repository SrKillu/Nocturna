import { Badge } from '@/components/ui/badge';
import type { MaterialV2Type } from '@/lib/types/materials-v2';

const labels: Record<MaterialV2Type, string> = {
  document: 'Documento',
  slides: 'Presentación',
  video: 'Video',
  link: 'Referencia',
};

export function V2MaterialTypeBadge({ type }: { type: MaterialV2Type }) {
  return <Badge variant="outline">{labels[type]}</Badge>;
}
