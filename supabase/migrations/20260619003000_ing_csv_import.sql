alter table public.expenses
  add column if not exists import_source text,
  add column if not exists import_fingerprint text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenses_import_metadata_check'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_import_metadata_check check (
        (import_source is null and import_fingerprint is null)
        or (
          import_source = 'ing_csv'
          and import_fingerprint is not null
          and char_length(import_fingerprint) between 32 and 128
        )
      );
  end if;
end;
$$;

create unique index if not exists expenses_user_import_fingerprint_uidx
  on public.expenses using btree (user_id, import_source, import_fingerprint);
