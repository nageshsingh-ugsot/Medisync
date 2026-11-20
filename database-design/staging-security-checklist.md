# MediSync staging security checklist

## Audit snapshot

This is a source and local-test review, not a live Supabase security
certification.

- [x] `src/` contains no `process.env`, `NEXT_PUBLIC_*`, `createClient`, or
      Supabase SDK references.
- [x] Login/signup are preview-only; they do not send authentication requests.
- [x] `@supabase/supabase-js` is installed but is not wired into the app.
- [x] `.gitignore` excludes `.env*` files except `.env.example`.
- [x] Phase 3A.2 locally verified all 13 tables have RLS enabled and forced,
      authenticated users have no direct DML grants, and anonymous access is
      denied in the simulated setup.
- [ ] Real Supabase JWT, PostgREST, API schema exposure, and deployed function
      ownership remain unverified.

The empty `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` entries in
`.env.example` are not used by the app. Do not populate them for staging
readiness. In particular, never put a service-role key in client code or a
`NEXT_PUBLIC_` variable. The anon/publishable key is intended to be public;
tenant protection must come from database grants and RLS, not key secrecy.

## Before deploying any integration

- [ ] Put only the dedicated staging URL and client-safe key in local/Preview
      configuration. Do not configure production values in the Preview build.
- [ ] Confirm the built client contains no service-role key or other secret.
      Search source and inspect browser assets after a future integration; do
      not print secret values while checking.
- [ ] Keep privileged environment reads in server-only modules/routes. Do not
      import such modules from `"use client"` components.
- [ ] Do not use a service-role client to answer a tenant-scoped browser
      request. It bypasses RLS; any future server operation must enforce caller
      identity and pharmacy membership explicitly.
- [ ] Do not trust a `pharmacy_id` supplied by the browser. Resolve the user
      from the verified Supabase session and check active membership and role
      for each operation.
- [ ] Do not log access tokens, passwords, customer records, invitation tokens,
      or secret environment values.
- [ ] Keep `medisync_private` out of PostgREST exposed schemas.
- [ ] Confirm any exposed `medisync` access is still controlled by grants and
      RLS, and that no direct browser-role write grants were added accidentally.

## Verify identity and PostgREST behavior

Perform these checks only after the staging project is approved and the app has
a reviewed Supabase client. Use a normal test-user session, not a service-role
key.

1. Sign in as a synthetic user. Ask the authenticated client for the current
   user ID through the Auth API; do not print or copy its access token.
2. Read that user's `medisync.profiles.id` through PostgREST. It should equal
   the Auth user ID. This checks that the request's verified JWT identity is
   what the RLS `auth.uid()` sees.
3. Read pharmacy-owned rows using a user with active membership. Only rows for
   authorized pharmacies should be returned. Cross-tenant SELECTs may return
   an empty result rather than an authorization error.
4. Repeat with an authenticated non-member and an anonymous request. Neither
   should read tenant-owned rows.
5. Try direct INSERT/UPDATE/DELETE as authenticated users. These drafts intend
   to deny all such writes, even for owners; future write paths must use
   reviewed role-checked transactions/RPCs.
6. As an owner/admin, read permitted invitation fields, then verify selecting
   `token_hash` is denied. Verify a cashier cannot read invitations,
   restock settings, or stock movement history.
7. Suspend a test membership, start a fresh request, and verify that access to
   that pharmacy disappears. Do not rely on a previously cached browser role.
8. Confirm the shared `medicine_catalog` behavior separately: its policy is
   intentionally global for authenticated users, unlike tenant-owned tables.

Do not paste bearer tokens into shared terminals, tickets, logs, or this
documentation. Never use a production identity for these checks.

## Verify deployed SECURITY DEFINER helpers

After migration, run this inspection query **only in the approved staging
project**. It is a checklist item, not an instruction to connect or execute
anything now.

```sql
SELECT
  n.nspname AS function_schema,
  p.proname AS function_name,
  pg_get_userbyid(p.proowner) AS function_owner,
  r.rolsuper AS owner_is_superuser,
  r.rolbypassrls AS owner_bypasses_rls,
  p.prosecdef AS is_security_definer,
  p.proconfig AS function_settings,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute
FROM pg_proc AS p
JOIN pg_namespace AS n ON n.oid = p.pronamespace
JOIN pg_roles AS r ON r.oid = p.proowner
WHERE n.nspname = 'medisync_private'
ORDER BY p.proname;
```

For both expected helpers, confirm:

- The owner is the reviewed migration owner, not an unexpected role.
- `is_security_definer` is true and `function_settings` contains exactly the
  fixed `search_path=pg_catalog` setting.
- The definitions still use schema-qualified objects and `auth.uid()`, contain
  no dynamic SQL, and do not accept a caller-supplied user ID.
- `authenticated_can_execute` is true and `anon_can_execute` is false.
- The owner’s superuser/BYPASSRLS status is understood. SECURITY DEFINER runs
  with owner privileges, so the explicit active-membership checks must remain
  intact.

Also verify that the API configuration does not expose
`medisync_private`; SQL grants alone do not prove the PostgREST exposure
configuration.

## Limits of the completed evidence

The local validation used PostgreSQL 16.16 and stubs for `auth.uid()`,
`anon`, and `authenticated`. It verified SQL behavior in that environment, not
Supabase JWT signature validation, PostgREST schema routing, deployed role
ownership, `service_role` behavior, or browser bundle contents after a live
integration. Those checks remain open.
