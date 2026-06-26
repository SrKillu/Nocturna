import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { AuthMeResponse, MembershipSummary } from '@/lib/types/auth';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn(),
    },
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const baseMembership: MembershipSummary = {
  membershipId: 'membership-admin',
  institutionId: 'institution-demo',
  institutionName: 'Nocturna Demo',
  institutionSlug: 'nocturna-demo',
  roleKey: 'admin',
  status: 'active',
  institutionStatus: 'active',
  joinedAt: '2026-06-01T00:00:00.000Z',
};

function makeSession(overrides: Partial<AuthMeResponse> = {}): AuthMeResponse {
  const membership = overrides.memberships?.[0] ?? baseMembership;

  return {
    profile: {
      id: 'profile-demo',
      email: 'admin.v2@nocturna.test',
      fullName: 'Admin V2',
      avatarUrl: null,
      isActive: true,
    },
    memberships: [membership],
    activeMembership: {
      userId: 'user-demo',
      profileId: 'profile-demo',
      institutionId: membership.institutionId,
      membershipId: membership.membershipId,
      roleKey: membership.roleKey,
      institutionStatus: membership.institutionStatus,
      membershipStatus: membership.status,
      capabilities: {},
    },
    membershipRequired: false,
    capabilities: {},
    ...overrides,
  };
}

async function importSessionPanel() {
  vi.stubGlobal('React', React);
  return import('@/components/auth/v2-session-panel');
}

describe('V2 session panel', () => {
  it('renders a dashboard continuation action for an already active admin context', async () => {
    const { V2SessionPanel } = await importSessionPanel();
    const html = renderToStaticMarkup(React.createElement(V2SessionPanel, { session: makeSession() }));

    expect(html).toContain('Contexto activo');
    expect(html).toContain('Nocturna Demo · admin');
    expect(html).toContain('Continuar al dashboard');
    expect(html).toContain('/v2/dashboard');
  });

  it('resolves a newly selected teacher membership as the active context after activation', async () => {
    const { getSelectedActiveMembership } = await importSessionPanel();
    const teacherMembership: MembershipSummary = {
      ...baseMembership,
      membershipId: 'membership-teacher',
      roleKey: 'teacher',
    };
    const session = makeSession({
      profile: {
        id: 'profile-teacher',
        email: 'teacher.v2@nocturna.test',
        fullName: 'Teacher V2',
        avatarUrl: null,
        isActive: true,
      },
      memberships: [teacherMembership],
      activeMembership: null,
      membershipRequired: true,
    });

    expect(getSelectedActiveMembership(session, 'membership-teacher')).toEqual(teacherMembership);
  });

  it('lets multi-membership users continue with the selected active membership', async () => {
    const { getSelectedActiveMembership } = await importSessionPanel();
    const adminMembership = baseMembership;
    const teacherMembership: MembershipSummary = {
      ...baseMembership,
      membershipId: 'membership-teacher',
      roleKey: 'teacher',
    };
    const session = makeSession({
      profile: {
        id: 'profile-multi',
        email: 'multi.v2@nocturna.test',
        fullName: 'Multi V2',
        avatarUrl: null,
        isActive: true,
      },
      memberships: [adminMembership, teacherMembership],
      activeMembership: null,
      membershipRequired: true,
    });

    expect(getSelectedActiveMembership(session, 'membership-teacher')).toEqual(teacherMembership);
  });

  it('does not treat suspended memberships as selectable active context', async () => {
    const { getSelectedActiveMembership } = await importSessionPanel();
    const suspendedMembership: MembershipSummary = {
      ...baseMembership,
      membershipId: 'membership-suspended',
      roleKey: 'student',
      status: 'suspended',
    };
    const session = makeSession({
      memberships: [suspendedMembership],
      activeMembership: null,
      membershipRequired: true,
    });

    expect(getSelectedActiveMembership(session, 'membership-suspended')).toBeNull();
  });
});
