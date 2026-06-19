import { Info } from 'lucide-react';

import { V2StudentAttendancePreview } from '@/components/v2/students/profile/v2-student-attendance-preview';
import { V2StudentCoursesPreview } from '@/components/v2/students/profile/v2-student-courses-preview';
import { V2StudentEvaluationsPreview } from '@/components/v2/students/profile/v2-student-evaluations-preview';
import { V2StudentNotesPreview } from '@/components/v2/students/profile/v2-student-notes-preview';
import { V2StudentProfileHeader } from '@/components/v2/students/profile/v2-student-profile-header';
import { V2StudentProfileTabs } from '@/components/v2/students/profile/v2-student-profile-tabs';
import { V2StudentRiskSummary } from '@/components/v2/students/profile/v2-student-risk-summary';
import type { StudentV2Profile } from '@/lib/types/students-v2';

interface V2StudentProfileProps {
  student: StudentV2Profile;
}

export function V2StudentProfile({ student }: V2StudentProfileProps) {
  return (
    <div className="space-y-5">
      <V2StudentProfileHeader student={student} />
      <V2StudentProfileTabs />

      <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          Este perfil usa datos académicos de demostración. No incluye edición, mensajería ni
          cambios de estado.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <V2StudentRiskSummary student={student} />
        <V2StudentCoursesPreview courses={student.relatedCourses} />
      </div>

      <V2StudentAttendancePreview student={student} />

      <div className="grid gap-5 lg:grid-cols-2">
        <V2StudentEvaluationsPreview evaluations={student.evaluationsPreview} />
        <V2StudentNotesPreview notes={student.notesPreview} />
      </div>
    </div>
  );
}
