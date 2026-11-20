# Phase 3A.1 local validation report

**Result: partial; database execution and RLS tests blocked.**

## Environment and safety

- The Docker CLI is present, but the Docker daemon could not be reached at
  `~/.docker/run/docker.sock`.
- No validation container was created, no Docker volume was created, and no
  existing Docker resource was stopped or removed.
- No local or remote PostgreSQL connection was attempted.
- `pglast` was not preinstalled. Version 8.8 was installed into a temporary
  directory outside the repository, used only to parse the two SQL files, and
  then removed.
- No Supabase stubs were created because there was no disposable PostgreSQL
  server in which to create them.
- No credentials or `.env.local` files were accessed.

## Draft inspection

**Execution order:** `migrations/001_core_schema.sql`, then
`migrations/002_rls_and_privileges.sql`. A disposable test database would first
need local-only stubs for `auth.users`, `auth.uid()`, and the `anon` and
`authenticated` roles. Those are not supplied by these migrations.

**PostgreSQL assumptions:** PostgreSQL 13 or later for built-in
`gen_random_uuid()`; `num_nonnulls` is also used. The draft uses ordinary
PostgreSQL schemas, enums, foreign keys, expression/partial indexes, and RLS.
No extension is explicitly required.

**Supabase dependencies:** `auth.users`, `auth.uid()`, and the Supabase API
roles `anon` and `authenticated` are assumed to exist. `service_role` is not
used by the SQL and bypasses RLS in Supabase. The drafts create `medisync` and
`medisync_private`; the latter must not be exposed through PostgREST. The
legacy `public` tables are not referenced by either migration.

**Functions and triggers:** Migration 002 defines two `SECURITY DEFINER`
helpers, `medisync_private.has_active_membership(uuid)` and
`medisync_private.has_pharmacy_role(uuid, medisync.member_role[])`. There are
no triggers and no sale, receiving, or invitation-write RPCs in these drafts.

**Foreign-key creation order:** profiles → pharmacies → memberships →
invitations; shared/custom medicine identities → pharmacy medicine
configuration → batches; customers → sales → sale items → stock movements;
restock settings depend on pharmacies. Composite tenant keys are declared for
custom identities, pharmacy medicines, batches, customers, sales, sale items,
movements, and membership actors.

**RLS and grants:** All 13 business tables have RLS enabled and forced, with
13 SELECT policies. Authenticated users receive read grants only; invitations
use a column-level grant that omits `token_hash`. No direct browser-role
write policy or write grant is drafted.

## Tests and exact results

| Test | Result |
|---|---|
| Parse `001_core_schema.sql` with `pglast` 8.8 | **PASS** — 39 PostgreSQL statements parsed |
| Parse `002_rls_and_privileges.sql` with `pglast` 8.8 | **PASS** — 56 PostgreSQL statements parsed |
| Table creation and migration order against PostgreSQL | **BLOCKED** — Docker daemon unavailable |
| Foreign-key, unique, check-constraint, and index behavior | **BLOCKED** — not executed |
| Invalid cross-pharmacy references rejected | **BLOCKED** — not executed |
| Member/non-member reads and multi-pharmacy isolation | **BLOCKED** — no database or auth stub |
| Cashier versus manager-only reads/operations | **BLOCKED** — no database; no write RPCs exist to exercise |
| Suspended-member access revocation | **BLOCKED** — predicate inspected only |
| Direct browser-role writes denied | **BLOCKED** — grants inspected only |
| Missing/malformed identity behavior | **BLOCKED** — Supabase `auth.uid()` not simulated |
| Migration reapplication | **NOT INTENDED** — these are one-time numbered migrations; `CREATE TYPE` and table statements are not idempotent |

No SQL errors were reported by the static parser. Parsing validates PostgreSQL
syntax only; it does not resolve referenced schemas, roles, tables, owners,
privileges, RLS behavior, or foreign-key target uniqueness. No schema or
security test is reported as passing.

## Security-definer review

- Both functions set `search_path = pg_catalog` and schema-qualify their table
  and `auth.uid()` references. Neither uses dynamic SQL.
- Neither accepts a user ID. Both derive identity from `auth.uid()` and verify
  active membership; the role helper also checks the requested role set.
- `p_pharmacy_id` and `p_roles` are caller-provided selectors, not authorization
  evidence. The function checks them against the authenticated user's active
  membership. The boolean helper may reveal whether that caller has a selected
  role for a guessed pharmacy ID if `medisync_private` is accidentally exposed;
  keep that schema out of the PostgREST exposed-schema list.
- The actual function owner and effective privileges could not be inspected
  without PostgreSQL. The deployed owner must be reviewed before staging; do
  not assume that `SECURITY DEFINER` ownership or Supabase role behavior is
  safe based on this parse.
- The local `auth.uid()` stub, JWT claim behavior, `service_role` bypass, and
  PostgREST column-level invitation grants were not tested.

## Required next steps before staging

1. Make Docker available, then rerun the migrations only in a newly created,
   network-isolated, no-volume container.
2. Create temporary `auth`/role stubs inside that disposable database and run
   the full positive and negative constraint/RLS matrix from the Phase 3A
   design.
3. Inspect the migration/function owner, grants, exposed schemas, and actual
   PostgREST behavior on the target staging PostgreSQL version.
4. Do not treat this syntax pass as approval to apply either migration to
   staging or production.

## Repository state

This report is a new, unstaged file. No Phase 3A draft was rewritten. Existing
staged and unstaged repository changes were left in place; no staging, commit,
or push was performed. The earlier Phase 3A design document's static-review
note describes that phase's manual review; this report records the later
`pglast` syntax-only check.
