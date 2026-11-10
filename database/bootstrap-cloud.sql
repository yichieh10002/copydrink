create schema if not exists tea_private;
revoke all on schema tea_private from public, anon, authenticated;

create table public.menu_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.menu_admins enable row level security;
revoke all on public.menu_admins from public, anon, authenticated;
grant select on public.menu_admins to authenticated;
create policy "admins_read_own_membership" on public.menu_admins for select to authenticated
 using (user_id = (select auth.uid()));

create table public.menu_drafts (
 store_key text primary key check (length(store_key) between 1 and 100),
 document jsonb not null check (
  jsonb_typeof(document) = 'object'
  and document ? 'brand' and jsonb_typeof(document->'brand') = 'object'
  and document->'brand' ? 'name' and jsonb_typeof(document->'brand'->'name') = 'string'
  and length(btrim(document->'brand'->>'name')) between 1 and 160
  and document ? 'items' and jsonb_typeof(document->'items') = 'array'
  and octet_length(document::text) <= 1000000
 ),
 revision bigint not null default 1 check (revision > 0),
 updated_at timestamptz not null default now()
);
alter table public.menu_drafts enable row level security;
revoke all on public.menu_drafts from public, anon, authenticated;
grant select on public.menu_drafts to authenticated;
grant insert (store_key, document) on public.menu_drafts to authenticated;
grant update (document) on public.menu_drafts to authenticated;
create policy "admins_read_drafts" on public.menu_drafts for select to authenticated
 using (exists (select 1 from public.menu_admins where user_id = (select auth.uid()) and active));
create policy "admins_insert_drafts" on public.menu_drafts for insert to authenticated
 with check (exists (select 1 from public.menu_admins where user_id = (select auth.uid()) and active));
create policy "admins_update_drafts" on public.menu_drafts for update to authenticated
 using (exists (select 1 from public.menu_admins where user_id = (select auth.uid()) and active))
 with check (exists (select 1 from public.menu_admins where user_id = (select auth.uid()) and active));

create function tea_private.stamp_menu_draft() returns trigger
 language plpgsql security invoker set search_path = ''
 as $$
 begin
  if TG_OP = 'UPDATE' then new.revision := old.revision + 1; end if;
  new.updated_at := pg_catalog.now();
  return new;
 end;
 $$;
revoke all on function tea_private.stamp_menu_draft() from public, anon, authenticated;
create trigger stamp_menu_draft before insert or update on public.menu_drafts
 for each row execute function tea_private.stamp_menu_draft();
comment on table public.menu_drafts is 'Private administrator drafts. Not a published menu endpoint. Document model may evolve; region prices must not be inferred.';
