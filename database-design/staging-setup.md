# MediSync staging setup

## Status

This is a preparation guide only. No Supabase project was contacted, no
migration was applied, and the application still uses mock data. Do not use the
original Refill Saathi project for MediSync.

The app is Next.js 16.4.6 with React 19.3.0 and TypeScript. `@supabase/supabase-js`
is in `package.json`, but no source file initializes it or reads environment
variables. Login and signup explicitly show preview-only messages.

## Create an isolated staging target

1. Create a **new Supabase project** named for MediSync staging in the intended
   organization. Do not reuse, import from, or copy settings/data from Refill
   Saathi.
2. Record the project name and project reference in your team’s approved
   password manager or deployment notes. Do not put credentials, JWTs, or
   project secrets in this guide.
3. Before migration, confirm the PostgreSQL version supports the draft
   assumptions (PostgreSQL 13 or later; Phase 3A.2 was executed on 16.16).
   Confirm the `auth` schema, `auth.users`, `auth.uid()`, `anon`, and
   `authenticated` are available in that project.
4. Confirm the new project has no existing `medisync` or `medisync_private`
   objects. The numbered drafts are not rerunnable migrations.

## Environment variables

The names below are taken from the MediSync `.env.example`. The current app
does not consume any of them, so **none is required to run the present mock
app**.

| Variable | Needed for current app? | Intended future use |
|---|---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | No | The dedicated staging project's URL for a future browser Supabase client. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | The project's client-safe anon/publishable API key for a future browser client. It is public, not a secret; RLS must protect data. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Not needed for this read-only staging preparation. Never use it in browser code or prefix it with `NEXT_PUBLIC_`. If a future reviewed server operation requires it, keep it server-only and narrowly scoped. |
| `CRON_SECRET` | No | Not used: MediSync has no cron route in this phase. |

For a future local integration, put only the staging URL and client-safe key in
an ignored `.env.local`. For Vercel, use a dedicated staging project or the
**Preview** environment only. `NEXT_PUBLIC_` values are included in browser
builds, so do not put secrets in those variables. Do not set or copy a service
role key for this task.

The `.gitignore` ignores `.env*` files other than `.env.example`. Keep it that
way; do not commit a populated environment file.

## API schema exposure

The SQL grants access to the `medisync` schema for `authenticated`, but that
does not itself expose the schema through PostgREST. After review and migration,
configure the staging API to expose `medisync` only if the app needs to query
these tables. Keep `medisync_private` out of the exposed-schema list. Verify
the resulting PostgREST behavior with the checklist in
[`staging-security-checklist.md`](./staging-security-checklist.md).

## Migration execution checklist — not executed

Only run this checklist after explicit approval to use the dedicated staging
project. Apply nothing as part of this preparation task.

- [ ] Confirm the Supabase dashboard project name/reference is the dedicated
      MediSync staging project, not Refill Saathi or production.
- [ ] Confirm PostgreSQL version, `auth` objects, and API roles required by the
      migrations.
- [ ] Confirm both MediSync schemas are absent or the target is otherwise an
      intentionally empty staging project.
- [ ] Review the migration owner and the effect of `ALTER DEFAULT PRIVILEGES`
      for that owner.
- [ ] Review the exposed API schemas: expose `medisync` only when needed; never
      expose `medisync_private`.
- [ ] Apply `migrations/001_core_schema.sql` once, then inspect its result.
- [ ] Apply `migrations/002_rls_and_privileges.sql` once, then inspect grants,
      policies, and helper functions.
- [ ] If either migration errors, stop. Do not blindly rerun it; inspect the
      partial state and decide whether to repair or recreate the empty staging
      project.
- [ ] Verify the actual function owner, `search_path`, and execute privileges
      using [`staging-security-checklist.md`](./staging-security-checklist.md).
- [ ] Create only synthetic test users/data and run
      [`staging-test-plan.md`](./staging-test-plan.md).
- [ ] Keep the application mock-only until the separate authentication and
      transactional-write work is reviewed.

## SQL draft changes identified

The Phase 3A.2 report found no SQL syntax or behavior correction required for
the current schema and read-only RLS design. That local pass is not approval to
apply the drafts to Supabase.

Before using the database for application writes, add and review transactional
operations for pharmacy creation with its initial active owner, owner transfer,
invitation acceptance, inventory receiving, and sales. The current schema does
not enforce that every pharmacy always has an active owner, and the current
grants intentionally deny all browser-role writes. Add these as reviewed
follow-up migrations/RPCs; do not broaden table grants to bypass the checks.

Before the first staging run, also confirm the actual migration execution role.
`ALTER DEFAULT PRIVILEGES` only affects objects created by the role whose
defaults are being changed. Both migrations are one-time scripts; if execution
partially fails, inspect the target rather than replaying them blindly.

## Readiness boundary

Phase 3A.2 validated the drafts against disposable local PostgreSQL 16.16,
including simulated roles and `auth.uid()`. It did not validate the Supabase
platform. See
[`validation/phase-3a2-local-validation.md`](./validation/phase-3a2-local-validation.md).
