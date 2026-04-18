'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/types/database';

export interface SessionSnapshot {
  userId: string;
  email: string;
  fullName: string | null;
  role: UserRole | null;
  institutionId: string | null;
  isActive: boolean;
  sessionVersion: number | null;
}

interface UseSessionResult {
  session: SessionSnapshot | null;
  loading: boolean;
}

/**
 * Reads the current Supabase session on the client and projects the JWT
 * app_metadata claims into a typed object that UI components can consume.
 *
 * Does NOT hit /api/auth/me — we read the token directly (Supabase keeps it
 * in local storage). For authoritative server checks use the API route.
 *
 * Returns `session = null` until hydration completes, so callers should gate
 * render on `loading`.
 */
export function useSession(): UseSessionResult {
  const [state, setState] = useState<UseSessionResult>({ session: null, loading: true });

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function hydrate(): Promise<void> {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const user = data.user;
      if (!user) {
        setState({ session: null, loading: false });
        return;
      }
      const meta = (user.app_metadata ?? {}) as {
        user_role?: UserRole;
        institution_id?: string;
        is_active?: boolean;
        session_version?: number;
      };
      const fullName =
        (user.user_metadata as { full_name?: string } | null)?.full_name ?? null;
      setState({
        loading: false,
        session: {
          userId: user.id,
          email: user.email ?? '',
          fullName,
          role: meta.user_role ?? null,
          institutionId: meta.institution_id ?? null,
          isActive: meta.is_active ?? true,
          sessionVersion:
            typeof meta.session_version === 'number' ? meta.session_version : null,
        },
      });
    }

    void hydrate();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void hydrate();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
