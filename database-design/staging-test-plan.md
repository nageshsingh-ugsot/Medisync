# MediSync staging tenant-isolation test plan

## Status and rules

This plan is for a dedicated MediSync staging project after approval. No users,
pharmacies, data, or migrations were created by this task. All test identities
and data below are synthetic. Do not use real pharmacy or customer data.

Create Auth users through the staging Auth UI or the reviewed staging signup
flow; do not insert directly into `auth.users`. Use non-deliverable
`@medisync.test` addresses and staging-only passwords managed outside this
document. Do not record passwords or JWTs here.

The SQL grants in the current draft intentionally provide no direct business
table writes. If fixtures cannot be created through the approved staging-only
setup process, stop and obtain approval for a controlled seed method. Do not
add temporary browser write grants to make the tests pass.

## Synthetic fixture

### Pharmacies

| Alias | Display name |
|---|---|
| Pharmacy A | MediSync QA Pharmacy A |
| Pharmacy B | MediSync QA Pharmacy B |

Use the actual generated UUIDs only in the staging fixture, not as credentials.

### Users and memberships

| Alias | Synthetic email | Pharmacy A | Pharmacy B |
|---|---|---|---|
| Owner A | `owner-a@medisync.test` | owner, active | — |
| Admin A | `admin-a@medisync.test` | admin, active | — |
| Cashier A | `cashier-a@medisync.test` | cashier, active | — |
| Owner B | `owner-b@medisync.test` | — | owner, active |
| Multi-workspace user | `multi@medisync.test` | pharmacist, active | cashier, active |
| Suspended A | `suspended-a@medisync.test` | pharmacist, suspended | — |
| Non-member | `outsider@medisync.test` | — | — |

Configure membership rows through an approved staging-only seed process.
Do not grant browser DML to create fixtures.

### Tenant-owned test rows

Create distinguishable synthetic rows for each pharmacy:

- One pharmacy medicine and one inventory batch per pharmacy. Use the same
  shared catalogue identity for both to verify that shared catalogue identity
  does not merge tenant inventory.
- One customer, one sale, one sale item, and one stock movement per pharmacy.
- One restock-settings row per pharmacy.
- One pending invitation per pharmacy with a fake hash only; never create or
  store a usable raw invitation token for this test.

Use clearly synthetic names such as `QA Customer A` and `QA Customer B`.

## Test execution and expected results

Use each account's normal authenticated session and PostgREST requests. Do not
use a service-role key. Record row counts and pass/fail results, not access
tokens or customer details.

### Identity and tenant boundaries

1. **Owner A:** `profiles.id` matches the authenticated user ID; sees Pharmacy
   A and its tenant-owned records; sees no Pharmacy B records.
2. **Owner B:** sees Pharmacy B and its tenant-owned records; sees no Pharmacy
   A records.
3. **Multi-workspace user:** sees both assigned pharmacies and only the rows
   belonging to those two memberships.
4. **Non-member:** sees no pharmacy-owned rows.
5. **Anonymous request:** cannot read tenant-owned rows.
6. **Membership revocation:** suspend the multi-workspace user's Pharmacy A
   membership, start a fresh request/session, and verify Pharmacy A becomes
   invisible while Pharmacy B remains visible.
7. **Self-profile:** each user reads only their own profile. The current
   membership policy intentionally allows a user to read their own membership
   row even when suspended; this does not restore access to business rows.

### Role restrictions

1. **Owner A and Admin A:** may read manager-permitted invitation fields.
   Selecting `token_hash` must be denied.
2. **Cashier A:** may read permitted inventory and sales data, but cannot read
   invitations, restock settings, or stock movements.
3. **Multi-workspace user:** as pharmacist in Pharmacy A, can read its
   stock-movement and restock-setting rows, but not invitations; as cashier in
   Pharmacy B, cannot read those restricted rows there.
4. **All authenticated users, including owners:** direct INSERT, UPDATE, and
   DELETE attempts against business tables must fail under these drafts.
   There are no write RPCs yet, so this is expected rather than a missing test
   workaround.
5. **Global catalogue:** authenticated users may read the shared catalogue by
   design. Do not count those rows as a tenant-isolation failure.

### JWT and PostgREST checks

- Through the authenticated client, compare the Auth API's current user ID
  with the row returned for that user's `profiles.id`. Do not inspect or log
  the bearer token.
- Ensure requests target `medisync` after that schema is deliberately exposed;
  verify `medisync_private` is not exposed.
- Verify tenant SELECT requests return only authorized rows. An empty result
  can be the expected RLS outcome; do not treat it as proof of a functioning
  session without the identity/profile check above.
- Verify direct writes fail with the expected permission denial.
- Repeat reads after sign-out and with an anonymous client to check that a
  cached authenticated session is not being reused.

## Evidence boundary

Phase 3A.2 passed local PostgreSQL 16.16 checks for schema creation,
constraints, indexes, simulated RLS reads, role restrictions, cross-tenant
foreign keys, missing identity, and membership revocation. The local
`auth.uid()` stub read a test setting; it did **not** validate real Supabase
JWTs or PostgREST behavior.

Every test above remains **unverified on Supabase staging** until run against
the dedicated staging project. Transactional stock/sales writes, invitation
acceptance, concurrency, rollback, and idempotency are outside these drafts and
must be tested after their reviewed RPCs are implemented.
