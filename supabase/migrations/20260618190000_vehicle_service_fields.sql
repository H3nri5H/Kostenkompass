alter table public.vehicles
  add column if not exists last_inspection_on date,
  add column if not exists next_inspection_on date;

alter table public.vehicle_parts
  add column if not exists product_url text,
  add column if not exists last_replaced_odometer_km integer,
  add column if not exists replacement_interval_km integer;

alter table public.vehicle_parts
  add constraint vehicle_parts_last_replacement_nonnegative
  check (last_replaced_odometer_km is null or last_replaced_odometer_km >= 0);

alter table public.vehicle_parts
  add constraint vehicle_parts_interval_positive
  check (replacement_interval_km is null or replacement_interval_km > 0);
