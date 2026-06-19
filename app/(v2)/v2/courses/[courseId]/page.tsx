import { notFound, redirect } from 'next/navigation';

import { V2CourseWorkspace } from '@/components/v2/courses/workspace/v2-course-workspace';
import { V2AccessDeniedState } from '@/components/v2/states/v2-access-denied-state';
import { V2ProblemState } from '@/components/v2/states/v2-problem-state';
import { SessionV2ValidationError, validateSessionV2 } from '@/lib/auth/session';
import { getMockCourseWorkspaceV2 } from '@/lib/mocks/courses-v2';
import { canAccessCoursesV2 } from '@/lib/types/courses-v2';

interface CourseWorkspaceV2PageProps {
  params: { courseId: string };
}

export default async function CourseWorkspaceV2Page({
  params,
}: CourseWorkspaceV2PageProps) {
  let session;

  try {
    session = await validateSessionV2();
  } catch (error) {
    if (error instanceof SessionV2ValidationError) {
      if (error.code === 'SESSION_NOT_AUTHENTICATED') {
        redirect('/login?error=not_authenticated');
      }

      return <V2ProblemState code={error.code} />;
    }

    return <V2ProblemState code="UNKNOWN" />;
  }

  if (!session.activeMembership) {
    redirect('/auth/v2-session');
  }

  const activeMembership = session.memberships.find(
    (membership) => membership.membershipId === session.activeMembership?.membershipId
  );

  if (!activeMembership) {
    return <V2ProblemState code="INSTITUTION_UNAVAILABLE" />;
  }

  if (!canAccessCoursesV2(session.activeMembership.capabilities)) {
    return (
      <V2AccessDeniedState
        institutionName={activeMembership.institutionName}
        canSwitchInstitution={session.memberships.length > 1}
      />
    );
  }

  const course = getMockCourseWorkspaceV2(
    params.courseId,
    session.activeMembership.roleKey
  );

  if (!course) {
    notFound();
  }

  return <V2CourseWorkspace course={course} />;
}
