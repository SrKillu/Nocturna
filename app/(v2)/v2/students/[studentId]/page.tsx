import { notFound, redirect } from 'next/navigation';

import { V2AccessDeniedState } from '@/components/v2/states/v2-access-denied-state';
import { V2ProblemState } from '@/components/v2/states/v2-problem-state';
import { V2StudentProfile } from '@/components/v2/students/profile/v2-student-profile';
import { SessionV2ValidationError, validateSessionV2 } from '@/lib/auth/session';
import { getMockStudentProfileV2 } from '@/lib/mocks/students-v2';
import { canAccessStudentsV2 } from '@/lib/types/students-v2';

interface StudentProfileV2PageProps {
  params: { studentId: string };
}

export default async function StudentProfileV2Page({
  params,
}: StudentProfileV2PageProps) {
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

  if (!canAccessStudentsV2(session.activeMembership.capabilities)) {
    return (
      <V2AccessDeniedState
        institutionName={activeMembership.institutionName}
        canSwitchInstitution={session.memberships.length > 1}
      />
    );
  }

  const student = getMockStudentProfileV2(
    params.studentId,
    session.activeMembership.roleKey
  );

  if (!student) {
    notFound();
  }

  return <V2StudentProfile student={student} />;
}
