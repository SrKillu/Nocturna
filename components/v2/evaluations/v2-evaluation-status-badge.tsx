import { Badge } from '@/components/ui/badge';
import type { EvaluationV2Status, EvaluationV2Type } from '@/lib/types/evaluations-v2';

const statusLabels: Record<EvaluationV2Status, string> = {
  draft: 'Borrador',
  active: 'Activa',
  review: 'En revisión',
  completed: 'Completada',
};

const typeLabels: Record<EvaluationV2Type, string> = {
  quiz: 'Prueba corta',
  project: 'Proyecto',
  exam: 'Examen',
  assignment: 'Tarea',
};

export function V2EvaluationStatusBadge({ status }: { status: EvaluationV2Status }) {
  return (
    <Badge variant={status === 'active' ? 'secondary' : 'outline'}>
      {statusLabels[status]}
    </Badge>
  );
}

export function V2EvaluationTypeBadge({ type }: { type: EvaluationV2Type }) {
  return <Badge variant="outline">{typeLabels[type]}</Badge>;
}
