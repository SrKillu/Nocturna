import {
  ALLOWED_EVIDENCE_FIELDS,
  type AllowedEvidenceField,
} from './harness-config';
import { containsSecretLikeValue, redactObject } from './redaction';

export interface EvidenceManifest {
  repositoryCommit?: string;
  harnessVersion?: string;
  publicToolVersions?: Record<string, string>;
  plannedMigrationSkeletonNames?: string[];
  plannedAssertionIds?: string[];
  plannedPolicySuiteIds?: string[];
  applicationCheckNames?: string[];
  cleanupStatus?: string;
  dryRun?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type EvidenceInput = Record<string, unknown>;

function unknownFields(input: EvidenceInput): string[] {
  const allowed = new Set<string>(ALLOWED_EVIDENCE_FIELDS);
  return Object.keys(input).filter((key) => !allowed.has(key));
}

export function buildEvidenceManifest(input: EvidenceInput): EvidenceManifest {
  const unknown = unknownFields(input);
  if (unknown.length > 0) {
    throw new Error(`Unknown evidence fields: ${unknown.join(', ')}`);
  }

  return redactObject(input) as EvidenceManifest;
}

export function validateEvidenceManifest(
  manifest: EvidenceManifest,
): ValidationResult {
  const errors: string[] = [];
  const unknown = unknownFields(manifest as EvidenceInput);
  if (unknown.length > 0) errors.push(`unknown-fields:${unknown.join(',')}`);
  if (manifest.dryRun !== true) errors.push('dry-run-required');
  if (containsSecretLikeValue(JSON.stringify(manifest))) {
    errors.push('secret-like-value-detected');
  }

  return { valid: errors.length === 0, errors };
}

export function isAllowedEvidenceField(
  field: string,
): field is AllowedEvidenceField {
  return (ALLOWED_EVIDENCE_FIELDS as readonly string[]).includes(field);
}
