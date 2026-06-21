import { describe, expect, it } from 'vitest';

import {
  buildEvidenceManifest,
  validateEvidenceManifest,
} from '../../../scripts/disposable-db/evidence';

describe('C39 evidence manifest', () => {
  it('accepts only allowlisted fields', () => {
    const manifest = buildEvidenceManifest({
      repositoryCommit: 'CURRENT_COMMIT_PLACEHOLDER',
      harnessVersion: 'C39-v1',
      dryRun: true,
    });
    expect(validateEvidenceManifest(manifest)).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('redacts values before reporting', () => {
    const email = ['person', 'example.com'].join('@');
    const manifest = buildEvidenceManifest({
      harnessVersion: `contact=${email}`,
      dryRun: true,
    });
    expect(manifest.harnessVersion).toBe('contact=[REDACTED]');
  });

  it('rejects unknown fields including raw environment input', () => {
    expect(() =>
      buildEvidenceManifest({
        rawEnv: { DATABASE_URL: 'not-allowed' },
        dryRun: true,
      }),
    ).toThrow(/Unknown evidence fields/);
  });

  it('includes planned policy suite IDs', () => {
    const manifest = buildEvidenceManifest({
      plannedPolicySuiteIds: ['auth-context', 'tenant-isolation'],
      dryRun: true,
    });
    expect(manifest.plannedPolicySuiteIds).toEqual([
      'auth-context',
      'tenant-isolation',
    ]);
  });

  it('requires dry-run evidence', () => {
    expect(validateEvidenceManifest({ dryRun: false })).toEqual({
      valid: false,
      errors: ['dry-run-required'],
    });
  });
});
