import { Files } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { CourseV2MaterialPreview } from '@/lib/types/courses-v2';

interface V2CourseMaterialsPreviewProps {
  materials: readonly CourseV2MaterialPreview[];
}

export function V2CourseMaterialsPreview({ materials }: V2CourseMaterialsPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="course-materials-title">
      <div className="border-b px-4 py-3">
        <h2 id="course-materials-title" className="flex items-center gap-2 font-semibold">
          <Files className="h-4 w-4 text-primary" aria-hidden />
          Materiales
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Recursos visibles del curso.</p>
      </div>
      <ul className="divide-y">
        {materials.map((material) => (
          <li key={material.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{material.title}</p>
              <p className="truncate text-xs text-muted-foreground">{material.detail}</p>
            </div>
            <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">
              {material.status === 'active' ? 'Publicado' : 'Borrador'}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
