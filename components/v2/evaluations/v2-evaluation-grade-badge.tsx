import { Badge } from '@/components/ui/badge';

export function V2EvaluationGradeBadge({
  averageGrade,
}: {
  averageGrade: number | null;
}) {
  if (averageGrade === null) {
    return <span className="text-xs text-muted-foreground">Sin promedio</span>;
  }

  return (
    <Badge variant={averageGrade >= 80 ? 'secondary' : 'outline'}>
      {averageGrade}
    </Badge>
  );
}
