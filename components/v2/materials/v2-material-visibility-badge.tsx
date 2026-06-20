import { Badge } from '@/components/ui/badge';
import type {
  MaterialV2Status,
  MaterialV2Visibility,
} from '@/lib/types/materials-v2';

const visibilityLabels: Record<MaterialV2Visibility, string> = {
  course: 'Curso',
  staff: 'Equipo',
  draft: 'Borrador',
};

const statusLabels: Record<MaterialV2Status, string> = {
  published: 'Publicado',
  pending: 'Pendiente',
  archived: 'Archivado',
};

export function V2MaterialVisibilityBadge({
  visibility,
}: {
  visibility: MaterialV2Visibility;
}) {
  return <Badge variant="outline">{visibilityLabels[visibility]}</Badge>;
}

export function V2MaterialStatusBadge({ status }: { status: MaterialV2Status }) {
  return (
    <Badge variant={status === 'published' ? 'secondary' : 'outline'}>
      {statusLabels[status]}
    </Badge>
  );
}
