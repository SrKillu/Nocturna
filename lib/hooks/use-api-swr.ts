'use client';

import useSWR, {
  SWRConfiguration,
  type SWRResponse,
  type Key,
} from 'swr';
import { apiFetch } from '@/lib/api/client';

/**
 * Client-side SWR wrapper for Nocturna's API.
 *
 *  * Goes through `apiFetch` so every request carries the CSRF echo cookie
 *    automatically (same-origin).
 *  * Normalises the response envelope — our API always returns
 *    `{ data }` on success and `{ error }` on failure.
 *  * Throws an Error on non-2xx, which SWR will surface on `error`.
 *
 * Server Components remain the primary data-fetching path; this hook is for
 * the cases where the UI has to react to polling or optimistic updates
 * without a full `router.refresh()`.
 */
export async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await apiFetch(url, { method: 'GET' });
  const body = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: { message?: string };
  };
  if (!res.ok) {
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return (body.data ?? (body as unknown as T)) as T;
}

export function useApiSWR<T>(
  key: Key,
  options?: SWRConfiguration<T>
): SWRResponse<T, Error> {
  return useSWR<T>(key, jsonFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: true,
    shouldRetryOnError: false,
    ...options,
  });
}
