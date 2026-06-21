import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createCleanupPlan } from './cleanup-plan';
import { buildEvidenceManifest, validateEvidenceManifest } from './evidence';
import { HARNESS_CONFIG } from './harness-config';
import { runPreflight } from './preflight';
import { redactObject } from './redaction';

const MIGRATION_SKELETONS = [
  '001_auth_tenant_core_skeleton.sql',
  '002_memberships_session_selection_skeleton.sql',
  '003_rls_helpers_grants_skeleton.sql',
  '004_academic_core_skeleton.sql',
  '005_courses_sections_read_slice_skeleton.sql',
  '006_policy_test_seed_skeleton.sql',
];

const ASSERTION_IDS = [
  'required-schemas',
  'required-tables',
  'constraints-and-indexes',
  'rls-enabled',
  'exact-grants',
  'safe-functions',
  'no-anon-grants',
];

const POLICY_SUITE_IDS = [
  'auth-context',
  'membership-lifecycle',
  'session-selection',
  'tenant-isolation',
  'direct-id-denial',
  'courses-sections',
  'staff-assignment',
  'student-enrollment',
  'guardian-links',
  'support-denial',
  'stale-state',
  'grants-rls',
  'v1-non-interference',
];

export interface HarnessRunResult {
  status: 'DRY_RUN_READY' | 'BLOCKED';
  dryRun: true;
  explain: boolean;
  phases: readonly string[];
  preflight: ReturnType<typeof runPreflight>;
  evidence: ReturnType<typeof buildEvidenceManifest>;
  evidenceValidation: ReturnType<typeof validateEvidenceManifest>;
  cleanupPlan: ReturnType<typeof createCleanupPlan>;
  executionNotice: string;
}

export function runHarnessDryRun(options?: {
  repoRoot?: string;
  explain?: boolean;
  pathExists?: (targetPath: string) => boolean;
  now?: () => Date;
}): HarnessRunResult {
  const repoRoot = path.resolve(options?.repoRoot ?? process.cwd());
  const targetPath = path.join(repoRoot, 'outputs', 'disposable-db', 'c39-dry-run');
  const preflight = runPreflight({
    repoRoot,
    plannedCommands: [],
    plannedPaths: [targetPath],
    pathExists: options?.pathExists,
    now: options?.now,
  });
  const cleanupPlan = createCleanupPlan({
    targetId: 'nocturna-c39-dry-run',
    targetPath,
  });
  const evidence = buildEvidenceManifest({
    repositoryCommit: 'CURRENT_COMMIT_PLACEHOLDER',
    harnessVersion: 'C39-dry-run-v1',
    publicToolVersions: { node: 'public-version-placeholder' },
    plannedMigrationSkeletonNames: MIGRATION_SKELETONS,
    plannedAssertionIds: ASSERTION_IDS,
    plannedPolicySuiteIds: POLICY_SUITE_IDS,
    applicationCheckNames: ['typecheck', 'test:unit', 'build'],
    cleanupStatus: 'PLANNED_DRY_RUN_ONLY',
    dryRun: true,
  });
  const evidenceValidation = validateEvidenceManifest(evidence);
  const blocked =
    preflight.status === 'BLOCKED' || evidenceValidation.valid === false;

  return {
    status: blocked ? 'BLOCKED' : 'DRY_RUN_READY',
    dryRun: true,
    explain: options?.explain ?? false,
    phases: HARNESS_CONFIG.plannedPhases,
    preflight,
    evidence,
    evidenceValidation,
    cleanupPlan,
    executionNotice:
      'No service, external command, SQL, migration, database or cleanup action was executed.',
  };
}

export function runHarnessCli(argv = process.argv.slice(2)): number {
  const json = argv.includes('--json');
  const explain = argv.includes('--explain');
  const result = redactObject(runHarnessDryRun({ explain }));
  console.log(json ? JSON.stringify(result, null, 2) : JSON.stringify(result, null, 2));
  return (result as HarnessRunResult).status === 'DRY_RUN_READY' ? 0 : 1;
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  process.exitCode = runHarnessCli();
}
