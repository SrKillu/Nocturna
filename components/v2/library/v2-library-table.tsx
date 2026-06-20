import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { V2LibraryAvailabilityBadge } from '@/components/v2/library/v2-library-availability-badge';
import { V2LibraryResourceTypeBadge } from '@/components/v2/library/v2-library-resource-type-badge';
import type { LibraryV2Resource } from '@/lib/types/library-v2';

export function V2LibraryTable({
  resources,
}: {
  resources: readonly LibraryV2Resource[];
}) {
  return (
    <div className="hidden overflow-hidden rounded-md border bg-card lg:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-4">Recurso</TableHead>
            <TableHead>Colección</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Curso relacionado</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Disponibilidad</TableHead>
            <TableHead>Última actualización</TableHead>
            <TableHead className="pr-4">Próxima acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell className="px-4 py-3 font-medium">
                {resource.title}
              </TableCell>
              <TableCell>{resource.collectionName}</TableCell>
              <TableCell>
                <V2LibraryResourceTypeBadge type={resource.type} />
              </TableCell>
              <TableCell>{resource.courseName}</TableCell>
              <TableCell>{resource.levelLabel}</TableCell>
              <TableCell>
                <V2LibraryAvailabilityBadge
                  availability={resource.availability}
                />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {resource.updatedLabel}
              </TableCell>
              <TableCell className="pr-4 text-sm text-muted-foreground">
                {resource.nextAction}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
