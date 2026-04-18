'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api/client';

/**
 * Client provider that subscribes to Supabase auth events and posts them
 * to /api/audit/log. Mounted once from the dashboard layout.
 *
 * SECURITY NOTE: this is best-effort. The authoritative audit entries for
 * business actions come from the server side (grades, invites, file uploads).
 */
export function AuthAuditLogger() {
  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      let audit: string | null = null;
      switch (event) {
        case 'SIGNED_IN':
          audit = 'login_success';
          break;
        case 'TOKEN_REFRESHED':
          audit = 'token_refresh';
          break;
        case 'SIGNED_OUT':
          audit = 'logout';
          break;
        default:
          audit = null;
      }
      if (!audit) return;
      void apiFetch('/api/audit/log', {
        method: 'POST',
        body: JSON.stringify({ event: audit }),
      }).catch(() => undefined);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
}
