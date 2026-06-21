import path from 'node:path';

export interface CleanupAction {
  id: string;
  description: string;
  targetId: string;
  targetPath: string;
  safetyCheck: string;
  dryRun: true;
}

export interface CleanupPlan {
  targetId: string;
  targetPath: string;
  dryRun: true;
  actions: CleanupAction[];
}

export interface CleanupPlanInput {
  targetId: string;
  targetPath: string;
}

const GENERIC_DESTRUCTIVE_PATTERNS = [
  /stop\s+all/i,
  /delete\s+all/i,
  /remove\s+all/i,
  /prune/i,
  /unknown\s+docker/i,
  /parent\s+project/i,
];

export function validateCleanupAction(action: CleanupAction): string[] {
  const errors: string[] = [];
  if (!action.targetId.trim()) errors.push('target-id-required');
  if (!action.targetPath.trim()) errors.push('target-path-required');
  if (!action.safetyCheck.trim()) errors.push('safety-check-required');
  if (action.dryRun !== true) errors.push('dry-run-required');

  const actionText = `${action.description} ${action.safetyCheck}`;
  if (GENERIC_DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(actionText))) {
    errors.push('generic-destructive-action-forbidden');
  }
  return errors;
}

export function createCleanupPlan(input: CleanupPlanInput): CleanupPlan {
  if (!input.targetId.trim()) throw new Error('targetId is required');
  if (!path.isAbsolute(input.targetPath)) {
    throw new Error('targetPath must be absolute');
  }

  const base = {
    targetId: input.targetId,
    targetPath: path.resolve(input.targetPath),
    dryRun: true as const,
  };

  const actions: CleanupAction[] = [
    {
      id: 'stop-exact-project',
      description: 'Plan stopping the exact disposable project.',
      ...base,
      safetyCheck: 'Verify the project identifier equals the approved target.',
    },
    {
      id: 'remove-exact-volumes',
      description: 'Plan removing volumes owned by the exact disposable project.',
      ...base,
      safetyCheck: 'Verify every volume label contains the approved target identifier.',
    },
    {
      id: 'remove-ephemeral-credentials',
      description: 'Plan removal of the exact ephemeral credential file.',
      ...base,
      safetyCheck: 'Verify the file resolves inside the approved disposable target path.',
    },
    {
      id: 'remove-raw-evidence',
      description: 'Plan removal of exact temporary raw evidence logs.',
      ...base,
      safetyCheck: 'Verify raw logs resolve inside the approved disposable target path.',
    },
    {
      id: 'verify-processes-ended',
      description: 'Plan verification that no target-specific process remains.',
      ...base,
      safetyCheck: 'Match processes only by the approved target identifier.',
    },
  ];

  const errors = actions.flatMap(validateCleanupAction);
  if (errors.length > 0) {
    throw new Error(`Unsafe cleanup plan: ${errors.join(', ')}`);
  }

  return { ...base, actions };
}
