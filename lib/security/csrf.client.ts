/**
 * Client-safe constants kept in sync with lib/security/csrf.ts.
 * Separated so client code doesn't accidentally import 'server-only' modules.
 */
export const CSRF_COOKIE = 'nocturna-csrf';
export const CSRF_HEADER = 'x-csrf-token';
