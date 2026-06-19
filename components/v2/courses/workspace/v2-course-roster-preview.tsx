import { UsersRound } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { CourseV2RosterMember } from '@/lib/types/courses-v2';

interface V2CourseRosterPreviewProps {
  members: readonly CourseV2RosterMember[];
  total: number;
}

export function V2CourseRosterPreview({ members, total }: V2CourseRosterPreviewProps) {
  return (
    <section className="rounded-md border bg-card" aria-labelledby="course-roster-title">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 id="course-roster-title" className="font-semibold">
            Estudiantes
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Vista previa del grupo.</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UsersRound className="h-4 w-4" aria-hidden />
          {total}
        </span>
      </div>
      <ul className="divide-y">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.name}</p>
              <p className="truncate text-xs text-muted-foreground">{member.detail}</p>
            </div>
            <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">
              {member.status === 'active'
                ? 'Activo'
                : member.status === 'completed'
                  ? 'Al día'
                  : 'Seguimiento'}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
