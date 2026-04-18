'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/client';

interface MutationOptions<T> {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: T) => void;
  /** When true, triggers `router.refresh()` after a successful mutation. */
  refresh?: boolean;
}

interface ApiResponse<T> {
  data?: T;
  error?: { message?: string; code?: string };
}

/**
 * Common mutation handler: POST/PUT/PATCH/DELETE with:
 *   * CSRF echo (through `apiFetch`)
 *   * Uniform toast feedback
 *   * `router.refresh()` on success when the caller sets `refresh: true`
 *   * Local `loading` state so the caller can disable their UI
 *
 * Keeps the UX vocabulary consistent across every form in the app without
 * duplicating 8+ lines of boilerplate in each.
 */
export function useMutation<T = unknown, TBody = unknown>() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (body: TBody, opts: MutationOptions<T>): Promise<T | null> => {
      if (loading) return null;
      setLoading(true);
      try {
        const res = await apiFetch(opts.url, {
          method: opts.method ?? 'POST',
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const payload = (await res.json().catch(() => ({}))) as ApiResponse<T>;
        if (!res.ok) {
          const msg =
            payload?.error?.message ?? opts.errorMessage ?? `HTTP ${res.status}`;
          toast.error(opts.errorMessage ?? 'No pudimos completar la acción', {
            description: msg,
          });
          return null;
        }
        if (opts.successMessage) toast.success(opts.successMessage);
        if (opts.onSuccess) opts.onSuccess(payload.data as T);
        if (opts.refresh !== false) router.refresh();
        return (payload.data ?? null) as T;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(opts.errorMessage ?? 'Error de red', { description: msg });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loading, router]
  );

  return { mutate, loading };
}
