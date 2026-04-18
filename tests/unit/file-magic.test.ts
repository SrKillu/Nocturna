import { describe, it, expect } from 'vitest';
import { verifyMagicBytes, VERIFY_BYTES_REQUIRED } from '@/lib/security/file-magic';

/**
 * T18 · File security · magic-byte validation.
 *
 * Every uploaded file is re-checked server-side. The client-declared MIME
 * type is only accepted if the first bytes of the blob match a signature in
 * our whitelist. Text types require a successful UTF-8 decode.
 */

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}
function pad(sig: number[], total = 32): Uint8Array {
  const out = new Uint8Array(total);
  out.set(sig, 0);
  return out;
}

describe('T18 · file-magic', () => {
  it('VERIFY_BYTES_REQUIRED is at least 32 (enough for our signatures)', () => {
    expect(VERIFY_BYTES_REQUIRED).toBeGreaterThanOrEqual(32);
  });

  it('accepts valid PDF header', () => {
    const pdf = pad([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    expect(verifyMagicBytes(pdf, 'application/pdf').ok).toBe(true);
  });

  it('accepts valid PNG header', () => {
    const png = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(verifyMagicBytes(png, 'image/png').ok).toBe(true);
  });

  it('accepts valid JPEG header', () => {
    const jpeg = pad([0xff, 0xd8, 0xff, 0xe0]);
    expect(verifyMagicBytes(jpeg, 'image/jpeg').ok).toBe(true);
  });

  it('accepts valid WEBP (RIFF...WEBP)', () => {
    const webp = new Uint8Array(32);
    webp.set([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
    expect(verifyMagicBytes(webp, 'image/webp').ok).toBe(true);
  });

  it('rejects a RIFF file whose type is not WEBP', () => {
    const notWebp = new Uint8Array(32);
    notWebp.set([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]); // WAVE
    const res = verifyMagicBytes(notWebp, 'image/webp');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('magic_mismatch');
  });

  it('accepts DOCX (ZIP container)', () => {
    const docx = pad([0x50, 0x4b, 0x03, 0x04]);
    expect(
      verifyMagicBytes(
        docx,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ).ok
    ).toBe(true);
  });

  it('rejects PDF bytes declared as PNG (spoofed MIME)', () => {
    const pdf = pad([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const res = verifyMagicBytes(pdf, 'image/png');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('magic_mismatch');
  });

  it('rejects an unknown/unsupported MIME', () => {
    const arbitrary = pad([0x00, 0x01, 0x02, 0x03]);
    const res = verifyMagicBytes(arbitrary, 'application/x-msdownload');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('mime_unknown');
  });

  it('accepts valid UTF-8 text', () => {
    const text = new TextEncoder().encode('hola, mundo — áéíóú');
    expect(verifyMagicBytes(text, 'text/plain').ok).toBe(true);
    expect(verifyMagicBytes(text, 'text/csv').ok).toBe(true);
    expect(verifyMagicBytes(text, 'text/markdown').ok).toBe(true);
  });

  it('rejects text/plain with invalid UTF-8', () => {
    // 0xC3 expects a continuation byte; 0x28 is not a valid one.
    const bad = bytes(0xc3, 0x28, 0xa0, 0xa1, 0, 0, 0, 0);
    const res = verifyMagicBytes(bad, 'text/plain');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('text_not_utf8');
  });

  it('rejects extremely small blobs', () => {
    const tiny = bytes(0x25, 0x50);
    expect(verifyMagicBytes(tiny, 'application/pdf').reason).toBe('too_small');
  });

  it('rejects an executable disguised as a PDF', () => {
    // Windows PE header (MZ) declared as PDF.
    const exe = pad([0x4d, 0x5a, 0x90, 0x00]);
    expect(verifyMagicBytes(exe, 'application/pdf').ok).toBe(false);
  });
});
