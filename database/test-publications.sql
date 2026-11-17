-- Transactional fixture test: no existing menu is modified or published.
-- Requires the sanitizing migration and an active admin subject below.
begin;

set local role authenticated;
select set_config('request.jwt.claim.sub', 'c8785803-4299-4d2b-8e78-caf3a944b7c5', true);

do $test$
declare
  fixture_key text := 'menu-security-rollback-fixture';
  draft_revision bigint;
  first_publication uuid;
  second_publication uuid;
  restored_revision bigint;
begin
  if exists (select 1 from public.menu_drafts where store_key = fixture_key)
    or exists (select 1 from public.menu_publications where store_key = fixture_key)
  then
    raise exception 'Security fixture key already exists';
  end if;

  insert into public.menu_drafts (store_key, document)
  values (
    fixture_key,
    pg_catalog.jsonb_build_object(
      'scope', 'menu-cms',
      'schemaVersion', 2,
      'brand', pg_catalog.jsonb_build_object('name', '安全交易測試', 'menus', pg_catalog.jsonb_build_array('測試')),
      'regions', pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object('id', 'all', 'name', '全台', 'enabled', true)),
      'activities', '[]'::jsonb,
      'items', pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
        'id', 'fixture-drink', 'name', '交易測試飲料', 'menuCategory', '測試',
        'active', true, 'recommended', false,
        'source', 'private test source', 'internalNote', 'private test note',
        'cups', pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
          'size', '中杯', 'cal', null,
          'prices', pg_catalog.jsonb_build_object('all', pg_catalog.jsonb_build_object('available', true, 'price', 0))
        ))
      ))
    )
  );

  select revision into draft_revision
  from public.menu_drafts where store_key = fixture_key;
  select id into first_publication
  from public.publish_menu_draft(fixture_key, draft_revision);
  if first_publication is null then raise exception 'First publication was not created'; end if;

  if exists (
    select 1 from public.menu_publications p
    cross join lateral pg_catalog.jsonb_array_elements(p.document->'items') as i(item)
    where p.id = first_publication
      and (i.item ? 'internalNote' or i.item ? 'source')
  ) then raise exception 'Admin-only fields appeared in a public snapshot'; end if;

  select id into second_publication
  from public.publish_menu_draft(fixture_key, draft_revision);
  if second_publication is null or second_publication = first_publication then
    raise exception 'Second publication was not created';
  end if;
  if (
    select count(*) from public.menu_publications
    where store_key = fixture_key and is_current
  ) <> 1 or (
    select count(*) from public.menu_publications
    where store_key = fixture_key
  ) <> 2 then raise exception 'Fixture publication history is inconsistent'; end if;

  update public.menu_drafts
  set document = pg_catalog.jsonb_set(document, '{items,0,internalNote}', '"newer private note"')
  where store_key = fixture_key;
  select revision into draft_revision
  from public.menu_drafts where store_key = fixture_key;
  select revision into restored_revision
  from public.restore_menu_publication(first_publication, draft_revision);
  if restored_revision <> draft_revision + 1 then
    raise exception 'Restoring must create a newer draft revision';
  end if;
  if (
    select document #>> '{items,0,internalNote}'
    from public.menu_drafts where store_key = fixture_key
  ) is distinct from 'newer private note' or (
    select document #>> '{items,0,source}'
    from public.menu_drafts where store_key = fixture_key
  ) is distinct from 'private test source' then
    raise exception 'Restoring lost current admin-only fields';
  end if;
end;
$test$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $test$
begin
  if exists (
    select 1 from public.menu_publications
    where store_key = 'menu-security-rollback-fixture' and not is_current
  ) then raise exception 'Anonymous readers can see fixture history'; end if;
  if (
    select count(*) from public.menu_publications
    where store_key = 'menu-security-rollback-fixture'
  ) <> 1 then raise exception 'Anonymous readers cannot see current fixture'; end if;
end;
$test$;

rollback;
