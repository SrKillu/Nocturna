import { describe, expect, it } from 'vitest';

import {
  containsSecretLikeValue,
  redactObject,
  redactText,
} from '../../../scripts/disposable-db/redaction';

describe('C39 disposable DB redaction', () => {
  it('redacts JWT-like values', () => {
    const jwt = [
      'eyJhbGciOiJIUzI1NiJ9',
      'eyJyb2xlIjoidGVzdCJ9',
      'signature123456',
    ].join('.');
    expect(redactText(`token=${jwt}`)).toBe('token=[REDACTED]');
  });

  it('redacts Postgres connection strings', () => {
    const connection = ['postgresql:', '', 'user:secret@db.example.test:5432/app'].join(
      '/',
    );
    expect(
      redactText(`db=${connection}`),
    ).toBe('db=[REDACTED]');
  });

  it('redacts email addresses', () => {
    const email = ['person', 'example.com'].join('@');
    expect(redactText(`actor=${email}`)).toBe('actor=[REDACTED]');
  });

  it('detects service-role-like values', () => {
    const key = ['service', 'role', 'key'].join('_');
    expect(
      containsSecretLikeValue(`${key}=abcdefghijklmnopqrstuvwxyz123456`),
    ).toBe(true);
  });

  it('does not redact safe synthetic labels and suite names', () => {
    expect(redactText('Alpha Owner')).toBe('Alpha Owner');
    expect(redactText('tenant-isolation')).toBe('tenant-isolation');
  });

  it('redacts nested object strings without changing non-strings', () => {
    expect(
      redactObject({
        actor: 'Alpha Owner',
        email: ['synthetic', 'example.test'].join('@'),
        count: 2,
      }),
    ).toEqual({
      actor: 'Alpha Owner',
      email: '[REDACTED]',
      count: 2,
    });
  });
});
