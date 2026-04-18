/**
 * Server-side magic-byte verifier.
 * Given the first bytes of an uploaded file, decide whether they match the
 * declared MIME. Plain-text MIMEs (no binary signature) are verified by a
 * successful UTF-8 decode instead.
 *
 * Why this exists: we never trust the Content-Type the client attached. The
 * client uploads directly to Storage via a signed URL, so we re-read a small
 * prefix of the object with the service-role after the fact and call this
 * function as the last line of defence.
 */

type Sig = readonly number[];

interface SignatureDef {
  /** List of acceptable byte prefixes. Empty -> skip magic check (text). */
  signatures: readonly Sig[];
  /** Additional validator beyond the simple prefix match. */
  extra?: (bytes: Uint8Array) => boolean;
}

function startsWith(bytes: Uint8Array, sig: Sig, offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i += 1) {
    if (bytes[offset + i] !== sig[i]) return false;
  }
  return true;
}

const SIGS: Record<string, SignatureDef> = {
  'application/pdf': {
    signatures: [[0x25, 0x50, 0x44, 0x46] /* %PDF */],
  },
  'image/png': {
    signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  'image/jpeg': {
    signatures: [[0xff, 0xd8, 0xff]],
  },
  'image/webp': {
    signatures: [[0x52, 0x49, 0x46, 0x46]], // RIFF
    extra: (b) => b.length >= 12 && startsWith(b, [0x57, 0x45, 0x42, 0x50], 8), // 'WEBP' at offset 8
  },
  // OOXML (docx/xlsx/pptx) are ZIP containers. We accept the ZIP header and
  // trust the higher-level MIME whitelist; extracting internal type needs a
  // full reader which is overkill for an MVP.
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    signatures: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    signatures: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    signatures: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]],
  },
  // Legacy MS Office (OLE compound document).
  'application/msword': {
    signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  },
  'application/vnd.ms-excel': {
    signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  },
  'application/vnd.ms-powerpoint': {
    signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  },
  // Text-ish MIMEs: no magic to check; verified via UTF-8 decode below.
  'text/plain': { signatures: [] },
  'text/csv': { signatures: [] },
  'text/markdown': { signatures: [] },
};

function isTextish(mime: string): boolean {
  return mime === 'text/plain' || mime === 'text/csv' || mime === 'text/markdown';
}

function isValidUtf8(bytes: Uint8Array): boolean {
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

export interface MagicVerifyResult {
  ok: boolean;
  reason?: 'mime_unknown' | 'magic_mismatch' | 'text_not_utf8' | 'too_small';
}

/**
 * Validate the leading bytes of a file against a declared MIME type.
 * Pass at least 32 bytes for reliable results.
 */
export function verifyMagicBytes(bytes: Uint8Array, mime: string): MagicVerifyResult {
  if (bytes.length < 4) return { ok: false, reason: 'too_small' };

  const def = SIGS[mime];
  if (!def) return { ok: false, reason: 'mime_unknown' };

  if (isTextish(mime)) {
    return isValidUtf8(bytes) ? { ok: true } : { ok: false, reason: 'text_not_utf8' };
  }

  for (const sig of def.signatures) {
    if (startsWith(bytes, sig)) {
      if (def.extra && !def.extra(bytes)) continue;
      return { ok: true };
    }
  }
  return { ok: false, reason: 'magic_mismatch' };
}

export const VERIFY_BYTES_REQUIRED = 32;
