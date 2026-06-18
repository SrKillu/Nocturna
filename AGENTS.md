# Nocturna Guardrails

- No tocar `main` sin aprobación.
- No hacer push, merge ni deploy sin aprobación.
- No tocar Supabase, Vercel ni Railway sin aprobación.
- No ejecutar migraciones ni SQL remoto sin aprobación.
- No imprimir secrets, tokens ni passwords.
- No modificar `.env`.
- No subir `scripts/staging/`.
- No modificar V1 sin aprobación.
- Auth V2 usa `validateSessionV2`, `activeMembership` y `capabilities`.
- Dashboard V2 vive bajo `/v2`.
- Todo reporte operativo va en `outputs/`.
