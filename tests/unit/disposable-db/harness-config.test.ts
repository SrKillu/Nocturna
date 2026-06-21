import { describe, expect, it } from 'vitest';

import {
  HARNESS_CONFIG,
  HARNESS_PHASES,
} from '../../../scripts/disposable-db/harness-config';

describe('C39 harness config', () => {
  it('defaults permanently to dry-run', () => {
    expect(HARNESS_CONFIG.dryRun).toBe(true);
  });

  it('contains all forbidden commands', () => {
    expect(HARNESS_CONFIG.forbiddenCommands).toEqual(
      expect.arrayContaining([
        'supabase start',
        'supabase stop',
        'supabase db reset',
        'supabase db push',
        'supabase db pull',
        'supabase db dump',
        'supabase migration up',
        'supabase test db',
      ]),
    );
  });

  it('contains forbidden paths', () => {
    expect(HARNESS_CONFIG.forbiddenPaths).toEqual(
      expect.arrayContaining([
        '.git',
        '.env',
        'node_modules',
        '.next',
        'supabase/.temp',
      ]),
    );
  });

  it('contains all planned C38 phases', () => {
    expect(HARNESS_CONFIG.plannedPhases).toEqual(HARNESS_PHASES);
    expect(HARNESS_CONFIG.plannedPhases).toContain('PLAN_POLICY_TESTS');
    expect(HARNESS_CONFIG.plannedPhases).toContain('PLAN_CLEANUP');
  });

  it('does not allow remote mode by default', () => {
    expect(HARNESS_CONFIG.allowRemoteMode).toBe(false);
  });
});
