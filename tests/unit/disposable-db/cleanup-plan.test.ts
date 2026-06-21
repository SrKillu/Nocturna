import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  createCleanupPlan,
  validateCleanupAction,
  type CleanupAction,
} from '../../../scripts/disposable-db/cleanup-plan';

const targetPath = path.resolve('outputs/disposable-db/c39-test');

function action(overrides: Partial<CleanupAction> = {}): CleanupAction {
  return {
    id: 'test',
    description: 'Plan exact target cleanup.',
    targetId: 'nocturna-c39-test',
    targetPath,
    safetyCheck: 'Verify exact target identifier.',
    dryRun: true,
    ...overrides,
  };
}

describe('C39 cleanup planning', () => {
  it('rejects generic stop-all and delete-all actions', () => {
    expect(
      validateCleanupAction(action({ description: 'stop all containers' })),
    ).toContain('generic-destructive-action-forbidden');
    expect(
      validateCleanupAction(action({ description: 'delete all volumes' })),
    ).toContain('generic-destructive-action-forbidden');
  });

  it('requires a specific target', () => {
    expect(validateCleanupAction(action({ targetId: '' }))).toContain(
      'target-id-required',
    );
    expect(() => createCleanupPlan({ targetId: '', targetPath })).toThrow();
  });

  it('requires dry-run actions', () => {
    expect(
      validateCleanupAction(
        action({ dryRun: false as unknown as true }),
      ),
    ).toContain('dry-run-required');
  });

  it('builds a target-specific plan without executing anything', () => {
    const plan = createCleanupPlan({
      targetId: 'nocturna-c39-test',
      targetPath,
    });
    expect(plan.dryRun).toBe(true);
    expect(plan.actions).toHaveLength(5);
    expect(plan.actions.every((item) => item.targetId === plan.targetId)).toBe(
      true,
    );
  });
});
