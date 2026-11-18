-- Keep one current publication and the five most recent previous publications
-- per store in the public table. Older rows remain recoverable in a private
-- archive, including metadata previously removed from public documents.
-- This migration is idempotent and runs atomically.
create table if not exists tea_private.menu_publication_archive (
  id uuid primary key,
  store_key text not null,
  source_revision bigint not null,
  document jsonb not null,
  published_at timestamptz not null,
  published_by uuid not null,
  is_current boolean not null check (not is_current),
  item_metadata jsonb
);
alter table tea_private.menu_publication_archive enable row level security;
revoke all on table tea_private.menu_publication_archive
from public, anon, authenticated;

create or replace function tea_private.retain_recent_publications(p_store_key text)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  older_ids uuid[];
  removed_count integer;
begin
  select pg_catalog.array_agg(id)
  into older_ids
  from (
    select id, pg_catalog.row_number() over (
      order by published_at desc, id desc
    ) as position
    from public.menu_publications
    where store_key = p_store_key and not is_current
  ) ranked
  where position > 5;

  if older_ids is null then return 0; end if;

  insert into tea_private.menu_publication_archive (
    id, store_key, source_revision, document, published_at,
    published_by, is_current, item_metadata
  )
  select p.id, p.store_key, p.source_revision, p.document, p.published_at,
    p.published_by, p.is_current, s.item_metadata
  from public.menu_publications p
  left join tea_private.publication_private_snapshots s on s.publication_id = p.id
  where p.id = any(older_ids)
  on conflict (id) do nothing;

  if (
    select pg_catalog.count(*)
    from tea_private.menu_publication_archive
    where id = any(older_ids)
  ) <> pg_catalog.array_length(older_ids, 1) then
    raise exception 'Publication archive incomplete for %', p_store_key;
  end if;

  delete from tea_private.publication_private_snapshots
  where publication_id = any(older_ids);
  delete from public.menu_publications
  where id = any(older_ids) and not is_current;
  get diagnostics removed_count = row_count;
  if removed_count <> pg_catalog.array_length(older_ids, 1) then
    raise exception 'Publication retention mismatch for %', p_store_key;
  end if;
  return removed_count;
end;
$function$;

revoke all on function tea_private.retain_recent_publications(text)
from public, anon, authenticated;

create or replace function tea_private.retain_after_publish()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.is_current then
    perform tea_private.retain_recent_publications(new.store_key);
  end if;
  return new;
end;
$function$;

revoke all on function tea_private.retain_after_publish()
from public, anon, authenticated;

drop trigger if exists retain_after_publish on public.menu_publications;
create trigger retain_after_publish
after insert on public.menu_publications
for each row execute function tea_private.retain_after_publish();

-- Existing older versions are archived and removed in this same migration.
select tea_private.retain_recent_publications(store_key)
from (select distinct store_key from public.menu_publications) stores;
