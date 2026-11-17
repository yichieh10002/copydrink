-- Apply as one transaction after reviewing current publication data.
-- The publication trigger is the boundary: even a direct admin INSERT cannot
-- place draft-only fields in a publicly readable menu snapshot.
begin;

-- Stop instead of silently discarding a note if real private content has
-- appeared since the last read-only audit. Archive and review it separately.
do $guard$
begin
  if exists (
    select 1 from public.menu_publications p
    cross join lateral pg_catalog.jsonb_array_elements(p.document->'items') as i(item)
    where p.document->>'scope' = 'menu-cms'
      and pg_catalog.btrim(coalesce(i.item->>'internalNote', '')) <> ''
  ) then
    raise exception 'Published history contains nonempty internal notes; review before redaction';
  end if;
end;
$guard$;

create or replace function tea_private.sanitize_publication_document()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  public_root jsonb;
  public_brand jsonb;
  public_items jsonb := '[]'::jsonb;
  draft_item jsonb;
  public_item jsonb;
begin
  if new.document->>'scope' is distinct from 'menu-cms' then
    return new;
  end if;

  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
  into public_root
  from pg_catalog.jsonb_each(new.document) as e(key, value)
  where e.key = any (array[
    'schemaVersion', 'scope', 'brand', 'activities', 'regions', 'items'
  ]);

  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
  into public_brand
  from pg_catalog.jsonb_each(new.document->'brand') as e(key, value)
  where e.key = any (array[
    'aliases', 'categories', 'categoryLabels', 'categoryTags', 'cupTypes',
    'ices', 'introduction', 'logoUrl', 'menuEdition', 'menus', 'menuUrl',
    'name', 'nutritionUrl', 'optionGroups', 'reminder', 'searchAliases',
    'sizeLabels', 'sizes', 'sourceFiles', 'sourceNote', 'storesUrl',
    'sugars', 'tags', 'topPicks', 'toppings', 'website', 'zhuyinAliases'
  ]);

  for draft_item in
    select value from pg_catalog.jsonb_array_elements(new.document->'items')
  loop
    select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
    into public_item
    from pg_catalog.jsonb_each(draft_item) as e(key, value)
    where e.key = any (array[
      'active', 'activity', 'allowedToppings', 'brand', 'calBasis',
      'categoryId', 'cups', 'fixedIce', 'fixedSugar', 'id', 'menuCategory',
      'menuSource', 'milkTypes', 'name', 'note', 'nutritionNote',
      'nutritionSource', 'optionGroups', 'optionOverrides', 'recommended',
      'reminder', 'sugarCals', 'tags', 'type', 'variants'
    ]);
    public_items := public_items || pg_catalog.jsonb_build_array(public_item);
  end loop;

  new.document := public_root || pg_catalog.jsonb_build_object(
    'brand', public_brand, 'items', public_items
  );
  return new;
end;
$function$;

revoke all on function tea_private.sanitize_publication_document()
from public, anon, authenticated;

drop trigger if exists sanitize_publication_document on public.menu_publications;
create trigger sanitize_publication_document
before insert or update of document on public.menu_publications
for each row execute function tea_private.sanitize_publication_document();

-- Keep the old source metadata available for a privileged manual recovery.
-- This schema is not exposed to the Data API, and no client role gets access.
create table if not exists tea_private.publication_private_snapshots (
  publication_id uuid primary key references public.menu_publications(id),
  item_metadata jsonb not null
);
alter table tea_private.publication_private_snapshots enable row level security;
revoke all on table tea_private.publication_private_snapshots
from public, anon, authenticated;

insert into tea_private.publication_private_snapshots (publication_id, item_metadata)
select p.id, pg_catalog.jsonb_agg(
  pg_catalog.jsonb_build_object('id', i.item->>'id')
  || case when i.item ? 'source'
     then pg_catalog.jsonb_build_object('source', i.item->'source')
     else '{}'::jsonb end
  || case when i.item ? 'internalNote'
     then pg_catalog.jsonb_build_object('internalNote', i.item->'internalNote')
     else '{}'::jsonb end
  order by i.position
)
from public.menu_publications p
cross join lateral pg_catalog.jsonb_array_elements(p.document->'items')
  with ordinality as i(item, position)
where p.document->>'scope' = 'menu-cms'
group by p.id
having pg_catalog.bool_or(i.item ? 'source' or i.item ? 'internalNote')
on conflict (publication_id) do nothing;

-- Published history no longer contains draft-only fields. Keep the current
-- draft intact; its private fields will be carried forward by restore below.
update public.menu_publications
set document = document
where document->>'scope' = 'menu-cms';

create or replace function public.restore_menu_publication(
  p_publication_id uuid,
  p_expected_revision bigint
)
returns setof public.menu_drafts
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  publication_store_key text;
  publication_document jsonb;
  current_draft jsonb;
  publication_item jsonb;
  current_item jsonb;
  private_fields jsonb;
  restored_items jsonb := '[]'::jsonb;
begin
  if not exists (
    select 1 from public.menu_admins
    where menu_admins.user_id = (select auth.uid()) and menu_admins.active
  ) then
    raise insufficient_privilege using message = 'Admin access required';
  end if;

  select p.store_key, p.document
  into publication_store_key, publication_document
  from public.menu_publications p where p.id = p_publication_id;

  if publication_document is null then
    raise no_data_found using message = 'Published version not found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(publication_store_key, 0)
  );

  select d.document into current_draft
  from public.menu_drafts d
  where d.store_key = publication_store_key
    and d.revision = p_expected_revision;

  if current_draft is null then
    raise serialization_failure
      using message = 'Draft revision changed; reload before restoring';
  end if;

  -- Restore public content from history, but retain today's admin-only
  -- annotations for items that still have the same stable ID.
  if publication_document->>'scope' = 'menu-cms' then
    for publication_item in
      select value from pg_catalog.jsonb_array_elements(publication_document->'items')
    loop
      select value into current_item
      from pg_catalog.jsonb_array_elements(current_draft->'items')
      where value->>'id' = publication_item->>'id'
      limit 1;

      select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
      into private_fields
      from pg_catalog.jsonb_each(coalesce(current_item, '{}'::jsonb)) as e(key, value)
      where e.key = any (array['internalNote', 'source']);

      restored_items := restored_items || pg_catalog.jsonb_build_array(
        (publication_item - 'internalNote' - 'source') || private_fields
      );
    end loop;
    publication_document := pg_catalog.jsonb_set(
      publication_document, '{items}', restored_items
    );
  end if;

  update public.menu_drafts
  set document = publication_document
  where store_key = publication_store_key
    and revision = p_expected_revision;

  if not found then
    raise serialization_failure
      using message = 'Draft revision changed; reload before restoring';
  end if;

  return query
  select d.* from public.menu_drafts d
  where d.store_key = publication_store_key;
end;
$function$;

revoke execute on function public.restore_menu_publication(uuid, bigint)
from public, anon;
grant execute on function public.restore_menu_publication(uuid, bigint)
to authenticated;

commit;
