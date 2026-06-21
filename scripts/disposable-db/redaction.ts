const REDACTED = '[REDACTED]';

const SAFE_EXACT_VALUES = new Set([
  'Alpha Institute',
  'Beta Institute',
  'Gamma Institute',
  'Alpha Owner',
  'Alpha Admin',
  'Alpha Teacher',
  'Alpha Assistant',
  'Alpha Student',
  'Alpha Guardian',
  'Alpha Support',
  'auth-context',
  'membership-lifecycle',
  'session-selection',
  'tenant-isolation',
  'courses-sections',
  'grants-rls',
]);

const REDACTION_PATTERNS: readonly RegExp[] = [
  /\bpostgres(?:ql)?:\/\/[^\s"'`]+/gi,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  /\bsb_(?:publishable|secret)_[A-Za-z0-9_-]{12,}\b/gi,
  /\b(?:anon|service[_-]?role)[_-]?(?:key)?\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{12,}["']?/gi,
  /\b(?:SUPABASE_[A-Z0-9_]+|DATABASE_URL)\s*=\s*["']?[^\s"']+["']?/g,
  /\b(?:password|passwd|pwd)\s*[:=]\s*["']?[^\s"',}]+["']?/gi,
  /\b(?:api[_-]?key|secret[_-]?key|access[_-]?token)\s*[:=]\s*["']?[^\s"',}]+["']?/gi,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b[a-f0-9]{48,}\b/gi,
  /\b[A-Za-z0-9+/=_-]{64,}\b/g,
];

export function redactText(input: string): string {
  if (SAFE_EXACT_VALUES.has(input)) {
    return input;
  }

  return REDACTION_PATTERNS.reduce(
    (redacted, pattern) => redacted.replace(pattern, REDACTED),
    input,
  );
}

export function containsSecretLikeValue(input: string): boolean {
  return redactText(input) !== input;
}

export function redactObject(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactText(value);
  }

  if (Array.isArray(value)) {
    return value.map(redactObject);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactObject(item)]),
    );
  }

  return value;
}
