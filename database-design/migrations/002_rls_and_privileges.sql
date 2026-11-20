-- DRAFT ONLY: do not run against production or staging in Phase 3A.
-- Business-table writes are intentionally withheld from browser roles.

revoke all on schema medisync from public, anon;
grant usage on schema medisync to authenticated;
grant usage on type
  medisync.member_role,
  medisync.member_status,
  medisync.invitation_status,
  medisync.stock_movement_type,
  medisync.sale_status
to authenticated;

-- RLS helpers stay outside the PostgREST-exposed business schema.
revoke all on schema medisync_private from public, anon;
grant usage on schema medisync_private to authenticated;

create or replace function medisync_private.has_active_membership(
  p_pharmacy_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from medisync.pharmacy_members as m
    where m.pharmacy_id = p_pharmacy_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$function$;

create or replace function medisync_private.has_pharmacy_role(
  p_pharmacy_id uuid,
  p_roles medisync.member_role[]
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $function$
  select exists (
    select 1
    from medisync.pharmacy_members as m
    where m.pharmacy_id = p_pharmacy_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any (p_roles)
  );
$function$;

revoke all on function medisync_private.has_active_membership(uuid)
  from public, anon;
revoke all on function medisync_private.has_pharmacy_role(
  uuid,
  medisync.member_role[]
) from public, anon;
grant execute on function medisync_private.has_active_membership(uuid)
  to authenticated;
grant execute on function medisync_private.has_pharmacy_role(
  uuid,
  medisync.member_role[]
) to authenticated;

alter table medisync.profiles enable row level security;
alter table medisync.profiles force row level security;
alter table medisync.pharmacies enable row level security;
alter table medisync.pharmacies force row level security;
alter table medisync.pharmacy_members enable row level security;
alter table medisync.pharmacy_members force row level security;
alter table medisync.pharmacy_invitations enable row level security;
alter table medisync.pharmacy_invitations force row level security;
alter table medisync.medicine_catalog enable row level security;
alter table medisync.medicine_catalog force row level security;
alter table medisync.pharmacy_custom_medicines enable row level security;
alter table medisync.pharmacy_custom_medicines force row level security;
alter table medisync.pharmacy_medicines enable row level security;
alter table medisync.pharmacy_medicines force row level security;
alter table medisync.inventory_batches enable row level security;
alter table medisync.inventory_batches force row level security;
alter table medisync.customers enable row level security;
alter table medisync.customers force row level security;
alter table medisync.sales enable row level security;
alter table medisync.sales force row level security;
alter table medisync.sale_items enable row level security;
alter table medisync.sale_items force row level security;
alter table medisync.stock_movements enable row level security;
alter table medisync.stock_movements force row level security;
alter table medisync.restock_settings enable row level security;
alter table medisync.restock_settings force row level security;

create policy profiles_read_self
  on medisync.profiles for select to authenticated
  using (id = auth.uid());

create policy pharmacies_read_member
  on medisync.pharmacies for select to authenticated
  using (medisync_private.has_active_membership(id));

create policy pharmacy_members_read_self_or_managers
  on medisync.pharmacy_members for select to authenticated
  using (
    user_id = auth.uid()
    or medisync_private.has_pharmacy_role(
      pharmacy_id,
      array['owner', 'admin']::medisync.member_role[]
    )
  );

create policy pharmacy_invitations_read_managers
  on medisync.pharmacy_invitations for select to authenticated
  using (
    medisync_private.has_pharmacy_role(
      pharmacy_id,
      array['owner', 'admin']::medisync.member_role[]
    )
  );

create policy medicine_catalog_read_authenticated
  on medisync.medicine_catalog for select to authenticated
  using (true);

create policy pharmacy_custom_medicines_read_member
  on medisync.pharmacy_custom_medicines for select to authenticated
  using (medisync_private.has_active_membership(pharmacy_id));

create policy pharmacy_medicines_read_member
  on medisync.pharmacy_medicines for select to authenticated
  using (medisync_private.has_active_membership(pharmacy_id));

create policy inventory_batches_read_member
  on medisync.inventory_batches for select to authenticated
  using (medisync_private.has_active_membership(pharmacy_id));

create policy customers_read_member
  on medisync.customers for select to authenticated
  using (medisync_private.has_active_membership(pharmacy_id));

create policy sales_read_member
  on medisync.sales for select to authenticated
  using (medisync_private.has_active_membership(pharmacy_id));

create policy sale_items_read_member
  on medisync.sale_items for select to authenticated
  using (medisync_private.has_active_membership(pharmacy_id));

create policy stock_movements_read_member
  on medisync.stock_movements for select to authenticated
  using (
    medisync_private.has_pharmacy_role(
      pharmacy_id,
      array['owner', 'admin', 'pharmacist']::medisync.member_role[]
    )
  );

create policy restock_settings_read_operations
  on medisync.restock_settings for select to authenticated
  using (
    medisync_private.has_pharmacy_role(
      pharmacy_id,
      array['owner', 'admin', 'pharmacist']::medisync.member_role[]
    )
  );

revoke all on all tables in schema medisync
  from public, anon, authenticated;
revoke all on all sequences in schema medisync
  from public, anon, authenticated;

grant select on
  medisync.profiles,
  medisync.pharmacies,
  medisync.pharmacy_members,
  medisync.medicine_catalog,
  medisync.pharmacy_custom_medicines,
  medisync.pharmacy_medicines,
  medisync.inventory_batches,
  medisync.customers,
  medisync.sales,
  medisync.sale_items,
  medisync.stock_movements,
  medisync.restock_settings
to authenticated;

-- Invitation hashes are never readable through table queries.
grant select (
  id,
  pharmacy_id,
  invited_email,
  role,
  status,
  invited_by,
  accepted_by,
  expires_at,
  accepted_at,
  revoked_at,
  created_at
) on medisync.pharmacy_invitations to authenticated;

alter default privileges in schema medisync
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema medisync
  revoke all on sequences from public, anon, authenticated;
