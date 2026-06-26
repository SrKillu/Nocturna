import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import type { AuthMeResponse } from '@/lib/types/auth';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
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

function buildActiveAdminSession(): AuthMeResponse {
  return {
    profile: {
      id: 'profile-admin-v2',
      email: 'admin.v2@nocturna.test',
      fullName: 'Admin V2',
      avatarUrl: null,
      isActive: true,
    },
    memberships: [
      {
        membershipId: '11111111-1111-4111-8111-111111111111',
        institutionId: '22222222-2222-4222-8222-222222222222',
        institutionName: 'Nocturna Demo',
        institutionSlug: 'nocturna-demo',
        roleKey: 'admin',
        status: 'active',
        institutionStatus: 'active',
        joinedAt: null,
      },
    ],
    activeMembership: {
      userId: 'user-admin-v2',
      profileId: 'profile-admin-v2',
      institutionId: '22222222-2222-4222-8222-222222222222',
      membershipId: '11111111-1111-4111-8111-111111111111',
      roleKey: 'admin',
      institutionStatus: 'active',
      membershipStatus: 'active',
      capabilities: {},
    },
    membershipRequired: false,
    capabilities: {},
  };
}

describe('V2SessionPanel', () => {
  it('lets an active V2 admin continue to the dashboard', async () => {
    vi.stubGlobal('React', React);
    const { V2SessionPanel } = await import('@/components/auth/v2-session-panel');
    const html = renderToStaticMarkup(
      React.createElement(V2SessionPanel, { session: buildActiveAdminSession() })
    );

    expect(html).toContain('Continuar al dashboard');
    expect(html).toContain('href="/v2/dashboard"');
    expect(html).toContain('Nocturna Demo · admin');
  });
});
