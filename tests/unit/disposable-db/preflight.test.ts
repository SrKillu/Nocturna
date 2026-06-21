import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { HARNESS_CONFIG } from '../../../scripts/disposable-db/harness-config';
import {
  isForbiddenCommand,
  isForbiddenPath,
  runPreflight,
} from '../../../scripts/disposable-db/preflight';

describe('C39 disposable DB preflight', () => {
  it('blocks forbidden commands', () => {
    expect(isForbiddenCommand('npx supabase db reset --local')).toBe(true);
    const result = runPreflight({
      repoRoot: HARNESS_CONFIG.allowedRootPath,
      plannedCommands: ['supabase start'],
      pathExists: () => false,
    });
    expect(result.status).toBe('BLOCKED');
    expect(result.blockers).toContain('forbidden-command-planned');
  });

  it('marks forbidden paths', () => {
    expect(isForbiddenPath('.env.local')).toBe(true);
    expect(isForbiddenPath('supabase/.temp/project-ref')).toBe(true);
  });

  it('detects env-file existence without reading content', () => {
    const checked: string[] = [];
    const result = runPreflight({
      repoRoot: HARNESS_CONFIG.allowedRootPath,
      pathExists: (target) => {
        checked.push(target);
        return target.endsWith('.env.local');
      },
    });

    expect(result.warnings).toContain('env-files-present-not-read');
    expect(checked).toContain(
      path.join(HARNESS_CONFIG.allowedRootPath, '.env.local'),
    );
  });

  it('produces a passing dry-run result for an isolated valid repo', () => {
    const result = runPreflight({
      repoRoot: HARNESS_CONFIG.allowedRootPath,
      pathExists: () => false,
      now: () => new Date('2026-06-21T00:00:00.000Z'),
    });
    expect(result.status).toBe('PASS');
    expect(result.dryRun).toBe(true);
    expect(result.timestamp).toBe('2026-06-21T00:00:00.000Z');
  });

  it('fails closed for an invalid simulated repository', () => {
    const result = runPreflight({
      repoRoot: path.join(HARNESS_CONFIG.allowedRootPath, 'wrong'),
      pathExists: () => false,
    });
    expect(result.status).toBe('BLOCKED');
    expect(result.blockers).toContain('repo-root-invalid');
  });
});
