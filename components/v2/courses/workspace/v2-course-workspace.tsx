import { Info } from 'lucide-react';

import { V2CourseEvaluationsPreview } from '@/components/v2/courses/workspace/v2-course-evaluations-preview';
import { V2CourseMaterialsPreview } from '@/components/v2/courses/workspace/v2-course-materials-preview';
import { V2CourseRosterPreview } from '@/components/v2/courses/workspace/v2-course-roster-preview';
import { V2CourseTabs } from '@/components/v2/courses/workspace/v2-course-tabs';
import { V2CourseWorkQueue } from '@/components/v2/courses/workspace/v2-course-work-queue';
import { V2CourseWorkspaceHeader } from '@/components/v2/courses/workspace/v2-course-workspace-header';
import type { CourseV2Workspace } from '@/lib/types/courses-v2';

interface V2CourseWorkspaceProps {
  course: CourseV2Workspace;
}

export function V2CourseWorkspace({ course }: V2CourseWorkspaceProps) {
  return (
    <div className="space-y-5">
      <V2CourseWorkspaceHeader course={course} />
      <V2CourseTabs />

      <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          Esta fundación usa datos académicos de demostración. Las acciones son vistas previas y
          todavía no modifican información.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <V2CourseWorkQueue items={course.workQueue} />
        <V2CourseRosterPreview
          members={course.rosterPreview}
          total={course.studentCount}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <V2CourseEvaluationsPreview evaluations={course.evaluationsPreview} />
        <V2CourseMaterialsPreview materials={course.materialsPreview} />
      </div>
    </div>
  );
}
