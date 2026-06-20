import { Badge } from '@/components/ui/badge';
import type { LibraryV2Availability } from '@/lib/types/library-v2';

const labels: Record<LibraryV2Availability, string> = {
  available: 'Disponible',
  reference: 'Solo referencia',
  featured: 'Destacado',
};

export function V2LibraryAvailabilityBadge({
  availability,
}: {
  availability: LibraryV2Availability;
}) {
  return (
    <Badge variant={availability === 'featured' ? 'secondary' : 'outline'}>
      {labels[availability]}
    </Badge>
  );
}
