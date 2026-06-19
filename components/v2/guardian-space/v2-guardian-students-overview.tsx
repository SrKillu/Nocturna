import { UsersRound } from 'lucide-react';

import { V2GuardianStudentCard } from '@/components/v2/guardian-space/v2-guardian-student-card';
import type { GuardianStudentV2 } from '@/lib/types/guardian-space-v2';

interface V2GuardianStudentsOverviewProps {
  students: readonly GuardianStudentV2[];
}

export function V2GuardianStudentsOverview({
  students,
}: V2GuardianStudentsOverviewProps) {
  return (
    <section aria-labelledby="guardian-students-title">
      <div className="mb-3">
        <h2 id="guardian-students-title" className="flex items-center gap-2 font-semibold">
          <UsersRound className="h-4 w-4 text-primary" aria-hidden />
          Estudiantes asociados
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Resumen limitado a las asociaciones de demostración.
        </p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {students.map((student) => (
          <V2GuardianStudentCard key={student.id} student={student} />
        ))}
      </ul>
    </section>
  );
}
