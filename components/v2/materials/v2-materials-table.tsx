import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { V2MaterialTypeBadge } from '@/components/v2/materials/v2-material-type-badge';
import {
  V2MaterialStatusBadge,
  V2MaterialVisibilityBadge,
} from '@/components/v2/materials/v2-material-visibility-badge';
import type { MaterialV2ListItem } from '@/lib/types/materials-v2';

export function V2MaterialsTable({
  materials,
}: {
  materials: readonly MaterialV2ListItem[];
}) {
  return (
    <div className="hidden overflow-hidden rounded-md border bg-card lg:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="px-4">Material</TableHead>
            <TableHead>Curso / sección</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Visibilidad</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Última actualización</TableHead>
            <TableHead className="pr-4">Próxima acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => (
            <TableRow key={material.id}>
              <TableCell className="px-4 py-3 font-medium">{material.title}</TableCell>
              <TableCell>
                <p>{material.courseName}</p>
                <p className="text-xs text-muted-foreground">{material.sectionLabel}</p>
              </TableCell>
              <TableCell>
                <V2MaterialTypeBadge type={material.type} />
              </TableCell>
              <TableCell>
                <V2MaterialVisibilityBadge visibility={material.visibility} />
              </TableCell>
              <TableCell>
                <V2MaterialStatusBadge status={material.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {material.updatedLabel}
              </TableCell>
              <TableCell className="pr-4 text-sm text-muted-foreground">
                {material.nextAction}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
