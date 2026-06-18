create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 160),
  manufacturer text,
  model text,
  fuel_type text not null default 'other' check (fuel_type in ('diesel', 'petrol', 'hybrid', 'electric', 'other')),
  license_plate text,
  vin text,
  kba text,
  engine_code text,
  transmission_code text,
  first_registration_year integer check (first_registration_year between 1900 and 2100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.vehicle_fuel_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  occurred_on date not null,
  odometer_km integer not null check (odometer_km >= 0),
  distance_km integer check (distance_km >= 0),
  liters numeric(10, 3) not null check (liters > 0),
  total_cost_cents bigint not null check (total_cost_cents >= 0),
  price_per_liter_cents integer generated always as (
    case when liters > 0 then round(total_cost_cents / liters)::integer else 0 end
  ) stored,
  consumption_l_per_100_km numeric(8, 3) generated always as (
    case when distance_km is not null and distance_km > 0 then round((liters * 100.0) / distance_km, 3) else null end
  ) stored,
  station text,
  full_tank boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.vehicle_parts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  manufacturer text,
  part_number text,
  specification text,
  location text,
  quantity_on_hand numeric(10, 2),
  reorder_threshold numeric(10, 2),
  status text not null default 'ok' check (status in ('ok', 'low_stock', 'needed', 'ordered', 'installed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists vehicles_user_idx on public.vehicles (user_id) where deleted_at is null;
create index if not exists vehicle_fuel_entries_vehicle_date_idx on public.vehicle_fuel_entries (vehicle_id, occurred_on desc) where deleted_at is null;
create index if not exists vehicle_fuel_entries_user_idx on public.vehicle_fuel_entries (user_id) where deleted_at is null;
create index if not exists vehicle_parts_vehicle_idx on public.vehicle_parts (vehicle_id) where deleted_at is null;
create index if not exists vehicle_parts_user_status_idx on public.vehicle_parts (user_id, status) where deleted_at is null;

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

drop trigger if exists vehicle_fuel_entries_set_updated_at on public.vehicle_fuel_entries;
create trigger vehicle_fuel_entries_set_updated_at
before update on public.vehicle_fuel_entries
for each row execute function public.set_updated_at();

drop trigger if exists vehicle_parts_set_updated_at on public.vehicle_parts;
create trigger vehicle_parts_set_updated_at
before update on public.vehicle_parts
for each row execute function public.set_updated_at();

alter table public.vehicles enable row level security;
alter table public.vehicle_fuel_entries enable row level security;
alter table public.vehicle_parts enable row level security;

revoke all on table public.vehicles from anon;
revoke all on table public.vehicle_fuel_entries from anon;
revoke all on table public.vehicle_parts from anon;

grant select, insert, update, delete on table public.vehicles to authenticated;
grant select, insert, update, delete on table public.vehicle_fuel_entries to authenticated;
grant select, insert, update, delete on table public.vehicle_parts to authenticated;

drop policy if exists vehicles_select_own on public.vehicles;
create policy vehicles_select_own on public.vehicles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists vehicles_insert_own on public.vehicles;
create policy vehicles_insert_own on public.vehicles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists vehicles_update_own on public.vehicles;
create policy vehicles_update_own on public.vehicles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists vehicles_delete_own on public.vehicles;
create policy vehicles_delete_own on public.vehicles for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists vehicle_fuel_entries_select_own on public.vehicle_fuel_entries;
create policy vehicle_fuel_entries_select_own on public.vehicle_fuel_entries for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists vehicle_fuel_entries_insert_own on public.vehicle_fuel_entries;
create policy vehicle_fuel_entries_insert_own on public.vehicle_fuel_entries for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists vehicle_fuel_entries_update_own on public.vehicle_fuel_entries;
create policy vehicle_fuel_entries_update_own on public.vehicle_fuel_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists vehicle_fuel_entries_delete_own on public.vehicle_fuel_entries;
create policy vehicle_fuel_entries_delete_own on public.vehicle_fuel_entries for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists vehicle_parts_select_own on public.vehicle_parts;
create policy vehicle_parts_select_own on public.vehicle_parts for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists vehicle_parts_insert_own on public.vehicle_parts;
create policy vehicle_parts_insert_own on public.vehicle_parts for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists vehicle_parts_update_own on public.vehicle_parts;
create policy vehicle_parts_update_own on public.vehicle_parts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists vehicle_parts_delete_own on public.vehicle_parts;
create policy vehicle_parts_delete_own on public.vehicle_parts for delete to authenticated using ((select auth.uid()) = user_id);
