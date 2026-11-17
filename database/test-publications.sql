begin;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  'c8785803-4299-4d2b-8e78-caf3a944b7c5',
  true
);

do $test$
declare
  draft_revision bigint;
  first_publication uuid;
  second_publication uuid;
  restored_revision bigint;
begin
  -- A real draft keeps these fields, but its public snapshot must not.
  update public.menu_drafts
  set document = jsonb_set(
    jsonb_set(document, '{items,0,internalNote}', '"private test note"'),
    '{items,0,source}', '"private test source"'
  )
  where store_key = 'menu-dezheng';

  select revision
  into draft_revision
  from public.menu_drafts
  where store_key = 'menu-dezheng';

  select id
  into first_publication
  from public.publish_menu_draft('menu-dezheng', draft_revision);

  if first_publication is null then
    raise exception 'First publication was not created';
  end if;

  if exists (
    select 1 from public.menu_publications p
    cross join lateral jsonb_array_elements(p.document->'items') as i(item)
    where p.id = first_publication
      and (i.item ? 'internalNote' or i.item ? 'source')
  ) then
    raise exception 'Admin-only fields appeared in a public snapshot';
  end if;

  select id
  into second_publication
  from public.publish_menu_draft('menu-dezheng', draft_revision);

  if second_publication is null or second_publication = first_publication then
    raise exception 'Second publication was not created';
  end if;

  if (
    select count(*)
    from public.menu_publications
    where store_key = 'menu-dezheng' and is_current
  ) <> 1 then
    raise exception 'Expected exactly one current publication';
  end if;

  if (
    select count(*)
    from public.menu_publications
    where store_key = 'menu-dezheng'
  ) <> 2 then
    raise exception 'Expected two immutable publication records';
  end if;

  update public.menu_drafts
  set document = jsonb_set(
    document, '{items,0,internalNote}', '"newer private note"'
  )
  where store_key = 'menu-dezheng';

  select revision into draft_revision
  from public.menu_drafts where store_key = 'menu-dezheng';

  select revision
  into restored_revision
  from public.restore_menu_publication(first_publication, draft_revision);

  if restored_revision <> draft_revision + 1 then
    raise exception 'Restoring must create a newer draft revision';
  end if;

  if (
    select document #>> '{items,0,internalNote}'
    from public.menu_drafts where store_key = 'menu-dezheng'
  ) is distinct from 'newer private note' then
    raise exception 'Restoring lost the current admin-only note';
  end if;

  if (
    select document #>> '{items,0,source}'
    from public.menu_drafts where store_key = 'menu-dezheng'
  ) is distinct from 'private test source' then
    raise exception 'Restoring lost the current admin-only source';
  end if;
end;
$test$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $test$
begin
  if exists (
    select 1
    from public.menu_publications
    where not is_current
  ) then
    raise exception 'Anonymous readers must not see publication history';
  end if;

  if (
    select count(*)
    from public.menu_publications
    where store_key = 'menu-dezheng'
  ) <> 1 then
    raise exception 'Anonymous readers must see the current publication';
  end if;
end;
$test$;

rollback;
