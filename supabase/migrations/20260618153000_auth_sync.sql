create extension if not exists pgcrypto;

create table if not exists public.categories (
  id text primary key,
  name text not null,
  icon text not null,
  color text not null,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null references public.categories(id),
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  merchant text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null references public.categories(id),
  name text not null check (char_length(trim(name)) between 1 and 200),
  manufacturer text,
  model text,
  purchased_on date not null,
  purchase_price_cents bigint not null check (purchase_price_cents > 0),
  residual_value_cents bigint not null default 0 check (residual_value_cents >= 0),
  useful_life_months integer not null check (useful_life_months between 1 and 1200),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (residual_value_cents <= purchase_price_cents)
);

create index if not exists expenses_user_id_idx on public.expenses using btree (user_id);
create index if not exists expenses_user_date_idx
  on public.expenses using btree (user_id, occurred_on desc)
  where deleted_at is null;
create index if not exists assets_user_id_idx on public.assets using btree (user_id);
create index if not exists assets_user_date_idx
  on public.assets using btree (user_id, purchased_on desc)
  where deleted_at is null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

insert into public.categories (id, name, icon, color, sort_order) values
  ('wohnen', 'Wohnen', 'home-outline', '#6B6ED6', 10),
  ('haushalt', 'Haushalt', 'flash-outline', '#BC6B32', 20),
  ('lebensmittel', 'Lebensmittel', 'cart-outline', '#3B8C6E', 30),
  ('kfz', 'Kfz', 'car-sport-outline', '#3976C2', 40),
  ('technik', 'Technik', 'laptop-outline', '#6E58A6', 50),
  ('versicherungen', 'Versicherungen', 'shield-checkmark-outline', '#397D88', 60),
  ('gesundheit', 'Gesundheit', 'heart-outline', '#BE5869', 70),
  ('freizeit', 'Freizeit', 'game-controller-outline', '#AA7A24', 80),
  ('sonstiges', 'Sonstiges', 'ellipsis-horizontal-outline', '#6A737D', 90)
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order;

alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.assets enable row level security;

revoke all on table public.categories from anon;
revoke all on table public.expenses from anon;
revoke all on table public.assets from anon;

grant select on table public.categories to authenticated;
grant select, insert, update, delete on table public.expenses to authenticated;
grant select, insert, update, delete on table public.assets to authenticated;

drop policy if exists categories_select_authenticated on public.categories;
create policy categories_select_authenticated
on public.categories
for select
to authenticated
using (true);

drop policy if exists expenses_select_own on public.expenses;
create policy expenses_select_own
on public.expenses
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists expenses_insert_own on public.expenses;
create policy expenses_insert_own
on public.expenses
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists expenses_update_own on public.expenses;
create policy expenses_update_own
on public.expenses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists expenses_delete_own on public.expenses;
create policy expenses_delete_own
on public.expenses
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists assets_select_own on public.assets;
create policy assets_select_own
on public.assets
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists assets_insert_own on public.assets;
create policy assets_insert_own
on public.assets
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists assets_update_own on public.assets;
create policy assets_update_own
on public.assets
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists assets_delete_own on public.assets;
create policy assets_delete_own
on public.assets
for delete
to authenticated
using ((select auth.uid()) = user_id);
