import path from 'node:path';

export const HARNESS_PHASES = [
  'PREFLIGHT',
  'PLAN_WORKDIR',
  'PLAN_MIGRATION_ORDER',
  'PLAN_SYNTHETIC_SEED',
  'PLAN_SCHEMA_ASSERTIONS',
  'PLAN_POLICY_TESTS',
  'PLAN_APP_CHECKS',
  'PLAN_EVIDENCE',
  'PLAN_CLEANUP',
] as const;

export type HarnessPhase = (typeof HARNESS_PHASES)[number];

export const ALLOWED_EVIDENCE_FIELDS = [
  'repositoryCommit',
  'harnessVersion',
  'publicToolVersions',
  'plannedMigrationSkeletonNames',
  'plannedAssertionIds',
  'plannedPolicySuiteIds',
  'applicationCheckNames',
  'cleanupStatus',
  'dryRun',
] as const;

export type AllowedEvidenceField = (typeof ALLOWED_EVIDENCE_FIELDS)[number];

export const SECRET_PATTERNS = [
  'jwt-like-token',
  'supabase-key',
  'postgres-connection-url',
  'password-assignment',
  'api-key-assignment',
  'supabase-env-assignment',
  'database-url-assignment',
  'email-address',
  'bearer-token',
  'long-secret-like-value',
] as const;

export interface HarnessConfig {
  batchId: 'C39';
  harnessName: string;
  dryRun: true;
  allowRemoteMode: false;
  allowedRootPath: string;
  forbiddenPaths: readonly string[];
  forbiddenCommands: readonly string[];
  plannedPhases: readonly HarnessPhase[];
  allowedEvidenceFields: readonly AllowedEvidenceField[];
  secretPatterns: readonly string[];
}

export const HARNESS_CONFIG: HarnessConfig = Object.freeze({
  batchId: 'C39',
  harnessName: 'Nocturna V2 Disposable DB Harness',
  dryRun: true,
  allowRemoteMode: false,
  allowedRootPath: path.resolve(
    'C:\\Users\\ccamp\\Documents\\Codex\\2026-06-13\\files-mentioned-by-the-user-nocturna\\work\\Nocturna-github-clean',
  ),
  forbiddenPaths: Object.freeze([
    '.git',
    '.env',
    '.env.local',
    '.env.production',
    'node_modules',
    '.next',
    'supabase/.temp',
  ]),
  forbiddenCommands: Object.freeze([
    'supabase start',
    'supabase stop',
    'supabase db reset',
    'supabase db push',
    'supabase db pull',
    'supabase db dump',
    'supabase migration up',
    'supabase test db',
  ]),
  plannedPhases: HARNESS_PHASES,
  allowedEvidenceFields: ALLOWED_EVIDENCE_FIELDS,
  secretPatterns: SECRET_PATTERNS,
});

export function normalizeForSafetyCheck(value: string): string {
  return value
    .trim()
    .replace(/\\/g, '/')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
