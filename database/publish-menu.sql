create table public.menu_publications (
  id uuid primary key default gen_random_uuid(),
  store_key text not null check (length(store_key) between 1 and 100),
  source_revision bigint not null check (source_revision > 0),
  document jsonb not null check (
    jsonb_typeof(document) = 'object'
    and octet_length(document::text) <= 1000000
  ),
  published_at timestamptz not null default now(),
  published_by uuid not null references auth.users(id),
  is_current boolean not null default true
);

create unique index menu_publications_one_current_per_store
  on public.menu_publications (store_key)
  where is_current;

create index menu_publications_store_history
  on public.menu_publications (store_key, published_at desc);

alter table public.menu_publications enable row level security;

revoke all on table public.menu_publications from public, anon, authenticated;
grant select (store_key, document, published_at, is_current)
  on table public.menu_publications to anon;
grant select, insert on table public.menu_publications to authenticated;
grant update (is_current) on table public.menu_publications to authenticated;

create policy published_current_public
on public.menu_publications
for select
to anon
using (is_current);

create policy published_current_or_admin
on public.menu_publications
for select
to authenticated
using (
  is_current
  or exists (
    select 1
    from public.menu_admins
    where menu_admins.user_id = (select auth.uid())
      and menu_admins.active
  )
);

create policy admins_insert_publications
on public.menu_publications
for insert
to authenticated
with check (
  is_current
  and published_by = (select auth.uid())
  and exists (
    select 1
    from public.menu_admins
    where menu_admins.user_id = (select auth.uid())
      and menu_admins.active
  )
);

create policy admins_retire_current_publication
on public.menu_publications
for update
to authenticated
using (
  is_current
  and exists (
    select 1
    from public.menu_admins
    where menu_admins.user_id = (select auth.uid())
      and menu_admins.active
  )
)
with check (
  not is_current
  and exists (
    select 1
    from public.menu_admins
    where menu_admins.user_id = (select auth.uid())
      and menu_admins.active
  )
);

create trigger validate_published_menu_cms
before insert or update on public.menu_publications
for each row execute function tea_private.validate_menu_cms();

create or replace function public.publish_menu_draft(
  p_store_key text,
  p_expected_revision bigint
)
returns setof public.menu_publications
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  draft_document jsonb;
  publication_id uuid;
begin
  if not exists (
    select 1
    from public.menu_admins
    where menu_admins.user_id = (select auth.uid())
      and menu_admins.active
  ) then
    raise insufficient_privilege using message = 'Admin access required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_store_key, 0)
  );

  select d.document
  into draft_document
  from public.menu_drafts d
  where d.store_key = p_store_key
    and d.revision = p_expected_revision;

  if draft_document is null then
    raise serialization_failure
      using message = 'Draft revision changed; reload before publishing';
  end if;

  update public.menu_publications
  set is_current = false
  where store_key = p_store_key
    and is_current;

  insert into public.menu_publications (
    store_key,
    source_revision,
    document,
    published_by,
    is_current
  )
  values (
    p_store_key,
    p_expected_revision,
    draft_document,
    (select auth.uid()),
    true
  )
  returning id into publication_id;

  return query
  select p.*
  from public.menu_publications p
  where p.id = publication_id;
end;
$function$;

revoke execute on function public.publish_menu_draft(text, bigint)
from public, anon;
grant execute on function public.publish_menu_draft(text, bigint)
to authenticated;

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
begin
  if not exists (
    select 1
    from public.menu_admins
    where menu_admins.user_id = (select auth.uid())
      and menu_admins.active
  ) then
    raise insufficient_privilege using message = 'Admin access required';
  end if;

  select p.store_key, p.document
  into publication_store_key, publication_document
  from public.menu_publications p
  where p.id = p_publication_id;

  if publication_document is null then
    raise no_data_found using message = 'Published version not found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(publication_store_key, 0)
  );

  update public.menu_drafts
  set document = publication_document
  where store_key = publication_store_key
    and revision = p_expected_revision;

  if not found then
    raise serialization_failure
      using message = 'Draft revision changed; reload before restoring';
  end if;

  return query
  select d.*
  from public.menu_drafts d
  where d.store_key = publication_store_key;
end;
$function$;

revoke execute on function public.restore_menu_publication(uuid, bigint)
from public, anon;
grant execute on function public.restore_menu_publication(uuid, bigint)
to authenticated;

notify pgrst, 'reload schema';
