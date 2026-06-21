# Nocturna C39 disposable database harness

This directory contains a **dry-run-only** harness scaffold.

It does not:

- start or stop Supabase;
- execute external database commands;
- execute SQL or migrations;
- read `.env` contents;
- connect to remote services;
- delete files, containers or volumes.

The runner performs pure planning:

1. validates the approved repository root;
2. rejects forbidden planned commands and paths;
3. detects local `.env*`/`supabase/.temp` existence without reading contents;
4. lists future reconstruction phases;
5. builds redacted evidence;
6. builds a target-specific cleanup plan without executing it.

Future command, not authorized by C39:

```powershell
# FUTURE ONLY — DO NOT RUN WITHOUT APPROVAL
npx tsx scripts/disposable-db/run-harness.ts --dry-run --json
```

Even without `--dry-run`, the current implementation remains dry-run.
