import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  HARNESS_CONFIG,
  normalizeForSafetyCheck,
  type HarnessConfig,
} from './harness-config';
import { redactObject } from './redaction';

export type PreflightStatus = 'PASS' | 'BLOCKED';
export type CheckStatus = 'PASS' | 'WARNING' | 'BLOCKED';

export interface PreflightCheck {
  id: string;
  status: CheckStatus;
  message: string;
}

export interface PreflightResult {
  status: PreflightStatus;
  checks: PreflightCheck[];
  warnings: string[];
  blockers: string[];
  dryRun: true;
  timestamp: string;
  repoRoot: string;
}

export interface PreflightInput {
  repoRoot: string;
  plannedCommands?: readonly string[];
  plannedPaths?: readonly string[];
  now?: () => Date;
  pathExists?: (targetPath: string) => boolean;
  config?: HarnessConfig;
}

function canonicalPath(value: string): string {
  const normalized = path.resolve(value).replace(/[\\/]+$/, '');
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

export function isForbiddenCommand(
  command: string,
  config: HarnessConfig = HARNESS_CONFIG,
): boolean {
  const normalized = normalizeForSafetyCheck(command).replace(/^npx\s+/, '');
  return config.forbiddenCommands.some((forbidden) =>
    normalized.includes(normalizeForSafetyCheck(forbidden)),
  );
}

export function isForbiddenPath(
  candidatePath: string,
  config: HarnessConfig = HARNESS_CONFIG,
): boolean {
  const normalized = normalizeForSafetyCheck(candidatePath).replace(/^\.?\//, '');
  return config.forbiddenPaths.some((forbidden) => {
    const forbiddenNormalized = normalizeForSafetyCheck(forbidden);
    return (
      normalized === forbiddenNormalized ||
      normalized.startsWith(`${forbiddenNormalized}/`) ||
      normalized.includes(`/${forbiddenNormalized}/`)
    );
  });
}

export function runPreflight(input: PreflightInput): PreflightResult {
  const config = input.config ?? HARNESS_CONFIG;
  const pathExists = input.pathExists ?? existsSync;
  const checks: PreflightCheck[] = [];
  const warnings: string[] = [];
  const blockers: string[] = [];
  const repoMatches =
    canonicalPath(input.repoRoot) === canonicalPath(config.allowedRootPath);

  checks.push({
    id: 'repo-root',
    status: repoMatches ? 'PASS' : 'BLOCKED',
    message: repoMatches
      ? 'Repository root matches the approved checkout.'
      : 'Repository root does not match the approved checkout.',
  });
  if (!repoMatches) blockers.push('repo-root-invalid');

  const forbiddenCommands = (input.plannedCommands ?? []).filter((command) =>
    isForbiddenCommand(command, config),
  );
  checks.push({
    id: 'planned-commands',
    status: forbiddenCommands.length === 0 ? 'PASS' : 'BLOCKED',
    message:
      forbiddenCommands.length === 0
        ? 'No forbidden command is planned.'
        : 'One or more forbidden commands are planned.',
  });
  if (forbiddenCommands.length > 0) blockers.push('forbidden-command-planned');

  const forbiddenPaths = (input.plannedPaths ?? []).filter((candidate) =>
    isForbiddenPath(candidate, config),
  );
  checks.push({
    id: 'planned-paths',
    status: forbiddenPaths.length === 0 ? 'PASS' : 'BLOCKED',
    message:
      forbiddenPaths.length === 0
        ? 'No forbidden path is planned.'
        : 'One or more forbidden paths are planned.',
  });
  if (forbiddenPaths.length > 0) blockers.push('forbidden-path-planned');

  const supabaseTempPath = path.join(input.repoRoot, 'supabase', '.temp');
  const hasSupabaseTemp = pathExists(supabaseTempPath);
  checks.push({
    id: 'supabase-temp',
    status: hasSupabaseTemp ? 'BLOCKED' : 'PASS',
    message: hasSupabaseTemp
      ? 'supabase/.temp exists; linked/local state must be isolated before execution.'
      : 'No supabase/.temp directory detected.',
  });
  if (hasSupabaseTemp) blockers.push('supabase-temp-present');

  const envPaths = ['.env', '.env.local', '.env.production'].filter((name) =>
    pathExists(path.join(input.repoRoot, name)),
  );
  checks.push({
    id: 'env-files',
    status: envPaths.length > 0 ? 'WARNING' : 'PASS',
    message:
      envPaths.length > 0
        ? 'Environment files exist; the harness will not read them.'
        : 'No checked environment-file path detected.',
  });
  if (envPaths.length > 0) warnings.push('env-files-present-not-read');

  checks.push({
    id: 'dry-run',
    status: config.dryRun && !config.allowRemoteMode ? 'PASS' : 'BLOCKED',
    message:
      config.dryRun && !config.allowRemoteMode
        ? 'Dry-run is enforced and remote mode is disabled.'
        : 'Safe default configuration is not enforced.',
  });
  if (!config.dryRun || config.allowRemoteMode) {
    blockers.push('unsafe-default-config');
  }

  return {
    status: blockers.length === 0 ? 'PASS' : 'BLOCKED',
    checks,
    warnings,
    blockers,
    dryRun: true,
    timestamp: (input.now ?? (() => new Date()))().toISOString(),
    repoRoot: path.resolve(input.repoRoot),
  };
}

export function runPreflightCli(argv = process.argv.slice(2)): number {
  const result = runPreflight({
    repoRoot: process.cwd(),
    plannedCommands: [],
    plannedPaths: [],
  });
  const output = redactObject(result);
  const asJson = argv.includes('--json') || argv.includes('--dry-run');
  console.log(
    asJson ? JSON.stringify(output, null, 2) : String(JSON.stringify(output)),
  );
  return result.status === 'PASS' ? 0 : 1;
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectExecution) {
  process.exitCode = runPreflightCli();
}
