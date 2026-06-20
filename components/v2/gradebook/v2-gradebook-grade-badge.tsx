import { Badge } from '@/components/ui/badge';

export function V2GradebookGradeBadge({
  grade,
}: {
  grade: number | null;
}) {
  if (grade === null) {
    return <Badge variant="outline">Sin nota</Badge>;
  }

  return (
    <Badge variant={grade >= 70 ? 'secondary' : 'destructive'}>
      {grade}
    </Badge>
  );
}
