-- DRAFT ONLY: do not run against production or staging in Phase 3A.
-- All MediSync business tables live here; legacy public tables are untouched.

create schema if not exists medisync;
create schema if not exists medisync_private;

create type medisync.member_role as enum (
  'owner',
  'admin',
  'pharmacist',
  'cashier'
);

create type medisync.member_status as enum (
  'active',
  'suspended'
);

create type medisync.invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);

create type medisync.stock_movement_type as enum (
  'opening_stock',
  'purchase',
  'sale',
  'sale_return',
  'adjustment',
  'expired',
  'damaged'
);

create type medisync.sale_status as enum (
  'completed',
  'partially_returned',
  'returned',
  'voided'
);

create table medisync.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 160),
  phone_e164 text
    check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{1,14}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table medisync.pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null
    check (char_length(btrim(name)) between 1 and 200),
  registration_number text,
  phone_e164 text
    check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{1,14}$'),
  address text,
  created_by uuid not null references medisync.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table medisync.pharmacy_members (
  pharmacy_id uuid not null
    references medisync.pharmacies (id) on delete restrict,
  user_id uuid not null
    references medisync.profiles (id) on delete restrict,
  role medisync.member_role not null,
  status medisync.member_status not null default 'active',
  invited_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (pharmacy_id, user_id),
  foreign key (pharmacy_id, invited_by)
    references medisync.pharmacy_members (pharmacy_id, user_id)
    on delete restrict
);

-- A pharmacy may have only one active owner; owner transfer is a controlled
-- transaction that deactivates the old owner and activates the new one.
create unique index pharmacy_members_one_active_owner_idx
  on medisync.pharmacy_members (pharmacy_id)
  where role = 'owner' and status = 'active';

create index pharmacy_members_user_active_idx
  on medisync.pharmacy_members (user_id, pharmacy_id)
  where status = 'active';

create table medisync.pharmacy_invitations (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null
    references medisync.pharmacies (id) on delete restrict,
  invited_email text not null
    check (char_length(btrim(invited_email)) between 3 and 320),
  role medisync.member_role not null
    check (role <> 'owner'),
  status medisync.invitation_status not null default 'pending',
  token_hash text not null unique
    check (token_hash ~ '^[0-9a-f]{64}$'),
  invited_by uuid not null,
  accepted_by uuid,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (pharmacy_id, invited_by)
    references medisync.pharmacy_members (pharmacy_id, user_id)
    on delete restrict,
  foreign key (pharmacy_id, accepted_by)
    references medisync.pharmacy_members (pharmacy_id, user_id)
    on delete restrict,
  check (
    (status = 'accepted' and accepted_by is not null and accepted_at is not null)
    or (status <> 'accepted' and accepted_by is null and accepted_at is null)
  ),
  check ((status = 'revoked') = (revoked_at is not null))
);

create unique index pharmacy_invitations_one_pending_email_idx
  on medisync.pharmacy_invitations (pharmacy_id, lower(btrim(invited_email)))
  where status = 'pending';

create index pharmacy_invitations_pending_expiry_idx
  on medisync.pharmacy_invitations (pharmacy_id, expires_at)
  where status = 'pending';

-- Shared, curated identities only. There is deliberately no natural-key
-- uniqueness constraint: similar descriptions must not merge implicitly.
create table medisync.medicine_catalog (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null
    check (char_length(btrim(brand_name)) between 1 and 200),
  generic_name text not null
    check (char_length(btrim(generic_name)) between 1 and 200),
  composition text not null
    check (char_length(btrim(composition)) between 1 and 1000),
  strength text not null
    check (char_length(btrim(strength)) between 1 and 120),
  dosage_form text not null
    check (dosage_form in (
      'tablet', 'capsule', 'syrup', 'powder', 'injection',
      'cream', 'drops', 'inhaler', 'other'
    )),
  pack_size text not null
    check (char_length(btrim(pack_size)) between 1 and 160),
  manufacturer text not null
    check (char_length(btrim(manufacturer)) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medicine_catalog_brand_search_idx
  on medisync.medicine_catalog (lower(brand_name) text_pattern_ops);

create index medicine_catalog_generic_search_idx
  on medisync.medicine_catalog (lower(generic_name) text_pattern_ops);

-- Custom identities are private to one pharmacy and remain distinct from the
-- shared catalogue. This makes their tenant ownership enforceable by a FK.
create table medisync.pharmacy_custom_medicines (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null
    references medisync.pharmacies (id) on delete restrict,
  brand_name text not null
    check (char_length(btrim(brand_name)) between 1 and 200),
  generic_name text not null
    check (char_length(btrim(generic_name)) between 1 and 200),
  composition text not null
    check (char_length(btrim(composition)) between 1 and 1000),
  strength text not null
    check (char_length(btrim(strength)) between 1 and 120),
  dosage_form text not null
    check (dosage_form in (
      'tablet', 'capsule', 'syrup', 'powder', 'injection',
      'cream', 'drops', 'inhaler', 'other'
    )),
  pack_size text not null
    check (char_length(btrim(pack_size)) between 1 and 160),
  manufacturer text not null
    check (char_length(btrim(manufacturer)) between 1 and 200),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, pharmacy_id),
  foreign key (pharmacy_id, created_by)
    references medisync.pharmacy_members (pharmacy_id, user_id)
    on delete restrict
);

create index pharmacy_custom_medicines_name_idx
  on medisync.pharmacy_custom_medicines
    (pharmacy_id, lower(brand_name) text_pattern_ops);

create table medisync.pharmacy_medicines (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null
    references medisync.pharmacies (id) on delete restrict,
  catalog_medicine_id uuid
    references medisync.medicine_catalog (id) on delete restrict,
  custom_medicine_id uuid,
  sku text,
  selling_price_paise bigint not null
    check (selling_price_paise >= 0),
  tax_rate_bps integer not null default 0
    check (tax_rate_bps between 0 and 10000),
  reorder_threshold integer not null default 0
    check (reorder_threshold >= 0),
  is_active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, pharmacy_id),
  check (num_nonnulls(catalog_medicine_id, custom_medicine_id) = 1),
  check (sku is null or char_length(btrim(sku)) between 1 and 80),
  foreign key (custom_medicine_id, pharmacy_id)
    references medisync.pharmacy_custom_medicines (id, pharmacy_id)
    on delete restrict,
  foreign key (pharmacy_id, created_by)
    references medisync.pharmacy_members (pharmacy_id, user_id)
    on delete restrict
);

create unique index pharmacy_medicines_catalog_unique_idx
  on medisync.pharmacy_medicines (pharmacy_id, catalog_medicine_id)
  where catalog_medicine_id is not null;

create unique index pharmacy_medicines_custom_unique_idx
  on medisync.pharmacy_medicines (pharmacy_id, custom_medicine_id)
  where custom_medicine_id is not null;

create unique index pharmacy_medicines_sku_unique_idx
  on medisync.pharmacy_medicines (pharmacy_id, lower(btrim(sku)))
  where sku is not null;

create index pharmacy_medicines_active_idx
  on medisync.pharmacy_medicines (pharmacy_id, is_active);

create table medisync.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null
    references medisync.pharmacies (id) on delete restrict,
  pharmacy_medicine_id uuid not null,
  batch_number text not null
    check (char_length(btrim(batch_number)) between 1 and 120),
  quantity_received integer not null
    check (quantity_received > 0),
  available_quantity integer not null
    check (available_quantity >= 0),
  expiry_date date not null,
  purchase_price_paise bigint not null
    check (purchase_price_paise >= 0),
  mrp_paise bigint
    check (mrp_paise is null or mrp_paise >= 0),
  selling_price_override_paise bigint
    check (
      selling_price_override_paise is null
      or selling_price_override_paise >= 0
    ),
  received_date date not null,
  received_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, pharmacy_medicine_id, pharmacy_id),
  unique (pharmacy_id, pharmacy_medicine_id, batch_number),
  foreign key (pharmacy_medicine_id, pharmacy_id)
    references medisync.pharmacy_medicines (id, pharmacy_id)
    on delete restrict,
  foreign key (pharmacy_id, received_by)
    references medisync.pharmacy_members (pharmacy_id, user_id)
    on delete restrict
);

create index inventory_batches_fefo_idx
  on medisync.inventory_batches (
    pharmacy_id,
    pharmacy_medicine_id,
    expiry_date,
    received_date,
    batch_number
  )
  where available_quantity > 0;

create table medisync.customers (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null
    references medisync.pharmacies (id) on delete restrict,
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 200),
  phone_e164 text
    check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{1,14}$'),
  email text
    check (email is null or char_length(btrim(email)) between 3 and 320),
  notes text
    check (notes is null or char_length(notes) <= 2000),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, pharmacy_id),
  foreign key (pharmacy_id, created_by)
    references medisync.pharmacy_members (pharmacy_id, user_id)
    on delete restrict
);

create index customers_phone_search_idx
  on medisync.customers (pharmacy_id, phone_e164)
  where phone_e164 is not null;

create index customers_name_idx
  on medisync.customers (pharmacy_id, lower(display_name) text_pattern_ops);

create table medisync.sales (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null
    references medisync.pharmacies (id) on delete restrict,
  receipt_number text not null
    check (char_length(btrim(receipt_number)) between 1 and 80),
  customer_id uuid,
  status medisync.sale_status not null default 'completed',
  currency_code text not null default 'INR'
    check (currency_code = 'INR'),
  subtotal_paise bigint not null
    check (subtotal_paise >= 0),
  tax_paise bigint not null
    check (tax_paise >= 0),
  total_paise bigint not null
    check (total_paise = subtotal_paise + tax_paise),
  idempotency_key uuid not null,
  request_fingerprint text not null
    check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, pharmacy_id),
  unique (pharmacy_id, receipt_number),
  unique (pharmacy_id, idempotency_key),
  foreign key (customer_id, pharmacy_id)
    references medisync.customers (id, pharmacy_id)
    on delete restrict,
  foreign key (pharmacy_id, created_by)
    references medisync.pharmacy_members (pharmacy_id, user_id)
    on delete restrict
);

create index sales_pharmacy_created_idx
  on medisync.sales (pharmacy_id, created_at desc);

create index sales_customer_history_idx
  on medisync.sales (pharmacy_id, customer_id, created_at desc)
  where customer_id is not null;

create table medisync.sale_items (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null
    references medisync.pharmacies (id) on delete restrict,
  sale_id uuid not null,
  pharmacy_medicine_id uuid not null,
  inventory_batch_id uuid not null,
  brand_name_snapshot text not null,
  product_description_snapshot text not null,
  batch_number_snapshot text not null,
  quantity integer not null
    check (quantity > 0),
  unit_price_paise bigint not null
    check (unit_price_paise >= 0),
  line_subtotal_paise bigint not null
    check (line_subtotal_paise >= 0),
  tax_rate_bps integer not null
    check (tax_rate_bps between 0 and 10000),
  tax_paise bigint not null
    check (tax_paise >= 0),
  line_total_paise bigint not null
    check (line_total_paise = line_subtotal_paise + tax_paise),
  created_at timestamptz not null default now(),
  unique (id, pharmacy_id, pharmacy_medicine_id, inventory_batch_id),
  check (line_subtotal_paise = quantity::bigint * unit_price_paise),
  foreign key (sale_id, pharmacy_id)
    references medisync.sales (id, pharmacy_id)
    on delete restrict,
  foreign key (pharmacy_medicine_id, pharmacy_id)
    references medisync.pharmacy_medicines (id, pharmacy_id)
    on delete restrict,
  foreign key (inventory_batch_id, pharmacy_medicine_id, pharmacy_id)
    references medisync.inventory_batches
      (id, pharmacy_medicine_id, pharmacy_id)
    on delete restrict
);

create index sale_items_sale_idx
  on medisync.sale_items (pharmacy_id, sale_id);

create index sale_items_batch_idx
  on medisync.sale_items (pharmacy_id, inventory_batch_id);

create table medisync.stock_movements (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null
    references medisync.pharmacies (id) on delete restrict,
  pharmacy_medicine_id uuid not null,
  inventory_batch_id uuid not null,
  movement_type medisync.stock_movement_type not null,
  quantity_delta integer not null
    check (quantity_delta <> 0),
  available_quantity_after integer not null
    check (available_quantity_after >= 0),
  unit_cost_paise bigint
    check (unit_cost_paise is null or unit_cost_paise >= 0),
  request_id uuid not null,
  source_sale_item_id uuid,
  note text
    check (note is null or char_length(note) <= 1000),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  foreign key (inventory_batch_id, pharmacy_medicine_id, pharmacy_id)
    references medisync.inventory_batches
      (id, pharmacy_medicine_id, pharmacy_id)
    on delete restrict,
  foreign key (
    source_sale_item_id,
    pharmacy_id,
    pharmacy_medicine_id,
    inventory_batch_id
  )
    references medisync.sale_items
      (id, pharmacy_id, pharmacy_medicine_id, inventory_batch_id)
    on delete restrict,
  foreign key (pharmacy_id, created_by)
    references medisync.pharmacy_members (pharmacy_id, user_id)
    on delete restrict,
  unique (pharmacy_id, request_id, inventory_batch_id, movement_type),
  check (
    (movement_type in ('opening_stock', 'purchase', 'sale_return')
      and quantity_delta > 0)
    or (movement_type in ('sale', 'expired', 'damaged')
      and quantity_delta < 0)
    or movement_type = 'adjustment'
  ),
  check (
    (movement_type in ('sale', 'sale_return')
      and source_sale_item_id is not null)
    or (movement_type not in ('sale', 'sale_return')
      and source_sale_item_id is null)
  )
);

create index stock_movements_batch_history_idx
  on medisync.stock_movements
    (pharmacy_id, inventory_batch_id, created_at desc);

create table medisync.restock_settings (
  pharmacy_id uuid primary key
    references medisync.pharmacies (id) on delete restrict,
  currency_code text not null default 'INR'
    check (currency_code = 'INR'),
  time_zone text not null default 'Asia/Kolkata'
    check (time_zone = 'Asia/Kolkata'),
  expiry_warning_days integer not null default 30
    check (expiry_warning_days between 1 and 365),
  default_reorder_threshold integer not null default 0
    check (default_reorder_threshold >= 0),
  default_tax_rate_bps integer not null default 0
    check (default_tax_rate_bps between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
