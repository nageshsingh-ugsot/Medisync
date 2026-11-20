# MediSync

MediSync is a responsive, multi-pharmacy workspace for pharmacy operations.
This project contains the MediSync workspace shell, Supabase-backed
sign-in/sign-up, a sample catalogue and inventory, and interactive browser-only
demos for billing, sales, customers, reports, and settings.

## Current boundaries

- Dashboard figures and workspaces are clearly labelled demonstration data.
- Sign-in and sign-up use Supabase SSR with cookie sessions. Workspace pages
  verify the user on the server; session refresh runs through `src/proxy.ts`.
- Signup sends the pharmacy metadata expected by the existing
  `public.create_pharmacy_for_new_user()` trigger. That trigger and the
  `public.pharmacies` table must already exist in Supabase for signup to create
  a pharmacy profile.
- Inventory, onboarding, dashboard figures, and workspace switching remain
  sample-only. The sample inventory is not written to Supabase.
- Billing, sales, customers, reports, and settings use local demo records saved
  in this browser's `localStorage`, scoped to the selected sample pharmacy.
  Their data is never written to Supabase. Use **Load demo data** on an empty
  section to create sample customers and receipts; settings can delete all
  browser demo records.
- Demo billing validates against unexpired sample stock and updates a separate
  local demo stock tally. It does not change the existing inventory data or
  create a real sale. Receipts are labeled as demonstrations, and WhatsApp
  messaging is disabled for all sample customers.
- The database-design migrations remain drafts. No database migration is part
  of this phase.
- The Refill Saathi reminder app is maintained separately in `../refill-saathi`.

## Product defaults

- Currency: INR, represented in mock data as integer paise.
- Business timezone: `Asia/Kolkata`.
- Expiry warning: 30 days in the demonstration dashboard.
- The dashboard's medicines, inventory, sales, activity, and pharmacies are mock data.
- Inventory and medicine pages use typed, pharmacy-scoped mock records. Available
  quantity is derived from unexpired batches; expired quantities remain visible
  in batch details but are excluded from available stock.
- The displayed inventory snapshot is dated `2026-11-17`. The 30-day expiry
  warning and FEFO planning helpers are configurable/pure demo logic.
- The custom-medicine and add-stock flows only hold temporary page state. The
  FEFO helper returns a plan and never deducts stock.

## Supabase setup

1. Copy the project URL and anon/public key from Supabase **Project Settings →
   API**.
2. Put them in `MediSync/.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

3. Restart the development server. Never put the service-role key in the
   browser or in these two variables.
4. The sign-up flow expects the existing pharmacy-profile trigger and table.
   Do not run a new migration as part of this phase.
5. Password reset uses `/auth/confirm`. In Supabase **Authentication →
   URL Configuration → Redirect URLs**, allow `http://localhost:3000/auth/confirm`
   for local development and `https://<your-domain>/auth/confirm` for the
   deployed app. Set the Site URL to the app's origin.

## Development

```bash
npm ci
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The inventory remains sample data. Production database-backed billing and
operational features will be added in a later phase.
