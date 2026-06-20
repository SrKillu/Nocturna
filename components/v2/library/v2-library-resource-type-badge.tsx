import { Badge } from '@/components/ui/badge';
import type { LibraryV2ResourceType } from '@/lib/types/library-v2';

const labels: Record<LibraryV2ResourceType, string> = {
  'digital-book': 'Libro digital',
  'study-guide': 'Guía de estudio',
  'supplemental-reading': 'Lectura',
  'external-video': 'Video simulado',
  practice: 'Práctica',
  'institutional-reference': 'Referencia',
};

export function V2LibraryResourceTypeBadge({
  type,
}: {
  type: LibraryV2ResourceType;
}) {
  return <Badge variant="outline">{labels[type]}</Badge>;
}
