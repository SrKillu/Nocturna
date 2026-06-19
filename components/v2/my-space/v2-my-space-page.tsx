import { GraduationCap } from 'lucide-react';

import { V2MyAttendancePreview } from '@/components/v2/my-space/v2-my-attendance-preview';
import { V2MyCoursesPreview } from '@/components/v2/my-space/v2-my-courses-preview';
import { V2MyEvaluationsPreview } from '@/components/v2/my-space/v2-my-evaluations-preview';
import { V2MyFeedbackPreview } from '@/components/v2/my-space/v2-my-feedback-preview';
import { V2MyNextActions } from '@/components/v2/my-space/v2-my-next-actions';
import { V2MySpaceHeader } from '@/components/v2/my-space/v2-my-space-header';
import { V2EmptyState } from '@/components/v2/states/v2-empty-state';
import type { MySpaceV2ViewModel } from '@/lib/types/my-space-v2';

interface V2MySpacePageProps {
  mySpace: MySpaceV2ViewModel | null;
}

export function V2MySpacePage({ mySpace }: V2MySpacePageProps) {
  if (!mySpace) {
    return (
      <V2EmptyState
        icon={GraduationCap}
        title="Tu espacio académico está vacío"
        description="Cuando tengas cursos y actividad académica disponible, aparecerán aquí."
      />
    );
  }

  return (
    <div className="space-y-5">
      <V2MySpaceHeader mySpace={mySpace} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <V2MyNextActions actions={mySpace.nextActions} />
        <V2MyCoursesPreview courses={mySpace.courses} />
      </div>

      <V2MyAttendancePreview attendance={mySpace.attendance} />

      <div className="grid gap-5 lg:grid-cols-2">
        <V2MyEvaluationsPreview evaluations={mySpace.evaluations} />
        <V2MyFeedbackPreview feedback={mySpace.feedback} />
      </div>
    </div>
  );
}
