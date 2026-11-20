-- Paste this whole file into Supabase: SQL Editor -> New query -> Run.
create table public.pharmacies (
  id uuid primary key references auth.users (id) on delete cascade,
  owner_name text not null check (char_length(owner_name) between 1 and 120),
  whatsapp text not null check (whatsapp ~ '^91[6-9][0-9]{9}$'),
  pharmacy_name text not null check (char_length(pharmacy_name) between 1 and 160),
  area text not null check (char_length(area) between 1 and 160),
  created_at timestamptz not null default now()
);

create table public.refills (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 1 and 160),
  customer_phone text not null check (customer_phone ~ '^91[6-9][0-9]{9}$'),
  medicines text not null check (char_length(medicines) between 1 and 2000),
  repeat_every_days integer not null check (repeat_every_days between 1 and 3650),
  start_date date not null,
  end_date date,
  next_due_date date not null,
  status text not null default 'active'
    check (status in ('active', 'needs_reminder', 'completed')),
  last_stock_answer text
    check (last_stock_answer in ('yes', 'no', 'arranging')),
  stock_arrange_by date,
  last_pickup_answer text
    check (last_pickup_answer in ('picked_up', 'not_picked_up')),
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  check (last_stock_answer <> 'arranging' or stock_arrange_by is not null)
);

create index refills_pharmacy_due_idx
  on public.refills (pharmacy_id, next_due_date)
  where status <> 'completed';

alter table public.pharmacies enable row level security;
alter table public.refills enable row level security;

create policy "Owners can read their pharmacy"
  on public.pharmacies for select
  using (id = (select auth.uid()));

create policy "Owners can update their pharmacy"
  on public.pharmacies for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Owners can read their refills"
  on public.refills for select
  using (pharmacy_id = (select auth.uid()));

create policy "Owners can add their refills"
  on public.refills for insert
  with check (pharmacy_id = (select auth.uid()));

create policy "Owners can update their refills"
  on public.refills for update
  using (pharmacy_id = (select auth.uid()))
  with check (pharmacy_id = (select auth.uid()));

create policy "Owners can delete their refills"
  on public.refills for delete
  using (pharmacy_id = (select auth.uid()));

-- Create the pharmacy profile from signup metadata so it exists with the auth account.
create function public.create_pharmacy_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.pharmacies (id, owner_name, whatsapp, pharmacy_name, area)
  values (
    new.id,
    new.raw_user_meta_data ->> 'owner_name',
    new.raw_user_meta_data ->> 'whatsapp',
    new.raw_user_meta_data ->> 'pharmacy_name',
    new.raw_user_meta_data ->> 'area'
  );
  return new;
end;
$$;

revoke all on function public.create_pharmacy_for_new_user()
  from public, anon, authenticated;

create trigger on_auth_user_created_create_pharmacy
  after insert on auth.users
  for each row execute procedure public.create_pharmacy_for_new_user();
