/**
 * Server-side text sanitisation helpers.
 *
 * For *rich-text* inputs (rendered as HTML), install `isomorphic-dompurify`
 * and wrap it here with a `sanitizeHtml` function. Today every Nocturna input
 * is rendered as plain text, so we only need control-char stripping + length
 * enforcement.
 */

const CONTROL_CHARS_RE =
  // \u0000-\u0008 \u000B-\u000C \u000E-\u001F \u007F (keep \n \r \t)
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function sanitizeText(input: unknown, opts: { max?: number } = {}): string {
  if (typeof input !== 'string') return '';
  const trimmed = input.replace(CONTROL_CHARS_RE, '').trim();
  const max = opts.max ?? 10_000;
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

export function sanitizeOptionalText(
  input: unknown,
  opts: { max?: number } = {}
): string | null {
  const cleaned = sanitizeText(input, opts);
  return cleaned.length === 0 ? null : cleaned;
}
