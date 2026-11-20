# MediSync Phase 3A.2 — Local PostgreSQL Validation

## Scope and isolation

Both draft migrations were applied to a newly created disposable PostgreSQL
16.16 container named `medisync-phase3a2-validation-20261117-0111`. The
container used `--network none`, no published ports, and no persistent mounts.
Tests used only the container-local `medisync_test` database.

Local-only Supabase stubs were used: roles `anon`, `authenticated`, and
`service_role`; an `auth.users` table; and `auth.uid()` reading the local
`request.jwt.claim.sub` setting. This simulates only the SQL calls needed by
the draft policies. It does not validate Supabase JWT verification, PostgREST,
API schema exposure, or production role ownership.

## Migration and schema results

| Check | Result |
|---|---|
| PostgreSQL version | 16.16 on Alpine Linux, aarch64 |
| `001_core_schema.sql` | Applied successfully |
| `002_rls_and_privileges.sql` | Applied successfully after 001 |
| Tables in `medisync` | 13 |
| Tables with RLS enabled and forced | 13 of 13 |
| Tables with at least one policy | 13 of 13 |
| Indexes in `medisync` | 43 |
| Constraints | 117: 62 checks, 31 foreign keys, 13 primary keys, 11 unique |
| Explicit extension dependencies | None in the draft; only built-in `plpgsql` was present |

Both files are versioned migrations, not repeatable scripts. Migration 001
creates types and tables; migration 002 creates policies. Neither was replayed.

## Constraint tests

All negative tests below failed with the expected PostgreSQL error and were
caught by the test harness. A valid batch insert succeeded inside a transaction
that was then rolled back.

| Test | Result |
|---|---|
| Quantity received of zero | Pass — SQLSTATE `23514`, `inventory_batches_quantity_received_check` |
| Negative purchase price | Pass — SQLSTATE `23514`, `inventory_batches_purchase_price_paise_check` |
| Second active owner in one pharmacy | Pass — SQLSTATE `23505`, `pharmacy_members_one_active_owner_idx` |
| Case-insensitive duplicate pharmacy SKU | Pass — SQLSTATE `23505`, `pharmacy_medicines_sku_unique_idx` |
| Duplicate normalized pending invitation email | Pass — SQLSTATE `23505`, `pharmacy_invitations_one_pending_email_idx` |
| Duplicate batch number for one pharmacy medicine | Pass — SQLSTATE `23505`, `inventory_batches_pharmacy_id_pharmacy_medicine_id_batch_nu_key` |
| Batch references another pharmacy's medicine | Pass — SQLSTATE `23503`, `inventory_batches_pharmacy_medicine_id_pharmacy_id_fkey` |
| Pharmacy medicine references another tenant's custom identity | Pass — SQLSTATE `23503`, `pharmacy_medicines_custom_medicine_id_pharmacy_id_fkey` |
| Sale references another tenant's customer | Pass — SQLSTATE `23503`, `sales_customer_id_pharmacy_id_fkey` |
| Sale item references another tenant's batch | Pass — SQLSTATE `23503`, `sale_items_inventory_batch_id_pharmacy_medicine_id_pharmac_fkey` |
| Customer creator is not a member of that pharmacy | Pass — SQLSTATE `23503`, `customers_pharmacy_id_created_by_fkey` |

No unexpected migration or constraint failures occurred.

## RLS, roles, and grants

The test dataset contained two pharmacies and synthetic owners, cashiers,
pharmacists, suspended members, a user with memberships in both pharmacies,
and an authenticated non-member.

| Test | Result |
|---|---|
| Pharmacy 1 owner reads own pharmacy, customer, invitation fields, restock settings, and stock movement | Pass |
| Owner reads pharmacy 2 customer | Pass — zero rows |
| Pharmacy 1 cashier reads permitted inventory | Pass |
| Cashier reads restock settings, invitations, or stock movements | Pass — zero rows |
| Cashier helper check for owner/admin role | Pass — `false` |
| Pharmacist reads stock movements and restock settings, but not invitations | Pass |
| User belonging to both pharmacies reads both authorized workspaces | Pass — two pharmacies and two customers |
| Suspended member reads pharmacy business rows | Pass — zero rows |
| Authenticated non-member reads pharmacy business rows | Pass — zero rows |
| Member is suspended, then re-queries both workspaces | Pass — revoked pharmacy hidden; remaining authorized pharmacy visible |
| Missing identity | Pass — `auth.uid()` is `NULL`; business query returns zero rows |
| Malformed UUID identity | Pass — query errors with `invalid input syntax for type uuid`, so no rows are returned |
| Cashier direct inventory `INSERT` | Pass — `permission denied for table inventory_batches` |
| Owner direct restock settings `UPDATE` | Pass — `permission denied for table restock_settings` |
| Invitation `token_hash` selection | Pass — `permission denied for table pharmacy_invitations`; allowed invitation fields remained readable |
| `anon` inventory read | Pass — `permission denied for schema medisync` |

Authenticated had no table-level `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`,
`REFERENCES`, or `TRIGGER` grants. It had table-level `SELECT` on 12 tables;
invitation reads were column-granted, excluding `token_hash`. These drafts
therefore allow no direct business writes, including for owners. Future writes
must use separately implemented, role-checked transactions/RPCs. No such write
RPC exists yet, so owner-only mutation behavior was not testable.

## SECURITY DEFINER review

The only two `SECURITY DEFINER` functions are
`medisync_private.has_active_membership(uuid)` and
`medisync_private.has_pharmacy_role(uuid, medisync.member_role[])`.

- Both were owned by local `postgres`, set `search_path = pg_catalog`, and used
  schema-qualified table and identity-function references.
- Both checked the caller from `auth.uid()` against active membership; neither
  used dynamic SQL or accepted caller identity as an argument.
- `authenticated` could execute them; `anon` could not. The private schema was
  not made available to `anon` or `public`.
- Tests showed that a caller-supplied pharmacy ID or role array did not grant
  access to another pharmacy; the result remained tied to that caller's
  membership.

The local `postgres` owner is not evidence that the actual Supabase migration
owner or function privileges are correct. Verify ownership and effective
privileges in the dedicated staging project before use.

## Failures, corrections, and remaining blockers

- **Unexpected SQL or security-test failures:** None.
- **Draft SQL corrections required by these tests:** None.
- **Not validated:** Supabase authentication/JWT behavior; PostgREST's handling
  of these policies and column grants; schema exposure settings; real
  `service_role` behavior; actual function ownership; migration runner
  transaction behavior; and any production write, invitation acceptance,
  stock receiving, sale/rollback, idempotency, or concurrency operation.
- **Before staging:** Apply only after review in the dedicated MediSync staging
  project; verify owner creation/transfer invariants, migration ownership,
  grants and schema exposure; then add and test the planned transactional write
  operations and real Supabase RLS behavior. This local run does not establish
  production readiness.

## Cleanup and safety confirmation

The only container created for this task was stopped and removed. It had no
mounts and no network connection; no other Docker resource was removed.

- No Supabase connection or remote SQL execution.
- No credentials or `.env.local` accessed.
- No Refill Saathi or other existing database changed.
- Original Phase 3A SQL drafts were not modified.
- No Git files were staged, committed, or pushed.
