create function tea_private.validate_menu_cms() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare d jsonb := new.document; r jsonb; item jsonb; cup jsonb; p jsonb; a jsonb;
 region_ids text[] := array[]::text[]; region_names text[] := array[]::text[];
 item_ids text[] := array[]::text[]; activity_ids text[] := array[]::text[]; sizes text[]; rid text; enabled_count integer := 0;
begin
 if new.store_key not like 'menu-%' and coalesce(d->>'scope','') <> 'menu-cms' then return new; end if;
 if d->>'scope' is distinct from 'menu-cms' or d->>'schemaVersion' is distinct from '2' then raise exception 'Invalid menu schema version' using errcode='23514'; end if;
 if jsonb_typeof(d->'regions') is distinct from 'array' or jsonb_typeof(d->'activities') is distinct from 'array' or jsonb_typeof(d->'brand'->'menus') is distinct from 'array' then raise exception 'Invalid menu collections' using errcode='23514'; end if;
 if d->'brand' ? 'categoryTags' then
  if jsonb_typeof(d->'brand'->'categoryTags') is distinct from 'object' then raise exception 'Invalid category tags' using errcode='23514'; end if;
  if exists(select 1 from jsonb_each(d->'brand'->'categoryTags') e where jsonb_typeof(e.value) is distinct from 'array' or jsonb_array_length(e.value)>10) then raise exception 'Invalid category tags' using errcode='23514'; end if;
  if exists(select 1 from jsonb_each(d->'brand'->'categoryTags') e cross join lateral jsonb_array_elements(e.value) tag(value) where jsonb_typeof(tag.value) is distinct from 'string' or length(btrim(tag.value #>> '{}')) not between 1 and 24) then raise exception 'Invalid category tag' using errcode='23514'; end if;
  if exists(select 1 from jsonb_each(d->'brand'->'categoryTags') e where (select count(*) from jsonb_array_elements_text(e.value))<>(select count(distinct btrim(value)) from jsonb_array_elements_text(e.value))) then raise exception 'Duplicate category tag' using errcode='23514'; end if;
 end if;
 if jsonb_array_length(d->'regions') not between 1 and 20 or jsonb_array_length(d->'activities')>200 or jsonb_array_length(d->'items')>1000 then raise exception 'Menu limits exceeded' using errcode='23514'; end if;
 for r in select value from jsonb_array_elements(d->'regions') loop
  rid:=r->>'id';
  if rid is null or rid !~ '^[a-zA-Z0-9_-]{1,80}$' or rid in ('__proto__','constructor','prototype') or rid=any(region_ids) or length(btrim(coalesce(r->>'name',''))) not between 1 and 80 or (r->>'name')=any(region_names) or jsonb_typeof(r->'enabled') is distinct from 'boolean' then raise exception 'Invalid region' using errcode='23514'; end if;
  region_ids:=array_append(region_ids,rid);region_names:=array_append(region_names,r->>'name');
  if (r->>'enabled')::boolean then enabled_count:=enabled_count+1; end if;
 end loop;
 if enabled_count=0 then raise exception 'At least one enabled region required' using errcode='23514'; end if;
 for a in select value from jsonb_array_elements(d->'activities') loop
  if length(btrim(coalesce(a->>'id',''))) not between 1 and 100 or (a->>'id')=any(activity_ids) or length(btrim(coalesce(a->>'name',''))) not between 1 and 160 or jsonb_typeof(a->'active') is distinct from 'boolean' then raise exception 'Invalid activity' using errcode='23514'; end if;
  activity_ids:=array_append(activity_ids,a->>'id');
 end loop;
 for item in select value from jsonb_array_elements(d->'items') loop
  if length(btrim(coalesce(item->>'id',''))) not between 1 and 100 or (item->>'id')=any(item_ids) or length(btrim(coalesce(item->>'name',''))) not between 1 and 160 or length(btrim(coalesce(item->>'menuCategory',''))) not between 1 and 160 or jsonb_typeof(item->'active') is distinct from 'boolean' or jsonb_typeof(item->'recommended') is distinct from 'boolean' then raise exception 'Invalid drink' using errcode='23514'; end if;
  if item ? 'tags' then
   if jsonb_typeof(item->'tags') is distinct from 'array' or jsonb_array_length(item->'tags')>10 then raise exception 'Invalid drink tags' using errcode='23514'; end if;
   if exists(select 1 from jsonb_array_elements(item->'tags') tag(value) where jsonb_typeof(tag.value) is distinct from 'string' or length(btrim(tag.value #>> '{}')) not between 1 and 24) then raise exception 'Invalid drink tag' using errcode='23514'; end if;
   if (select count(*) from jsonb_array_elements_text(item->'tags'))<>(select count(distinct btrim(value)) from jsonb_array_elements_text(item->'tags')) then raise exception 'Duplicate drink tag' using errcode='23514'; end if;
  end if;
  item_ids:=array_append(item_ids,item->>'id');
  if coalesce(item->>'activity','')<>'' and not (item->>'activity')=any(activity_ids) then raise exception 'Unknown activity' using errcode='23514'; end if;
  if jsonb_typeof(item->'cups') is distinct from 'array' then raise exception 'Invalid cups' using errcode='23514'; end if;
  if jsonb_array_length(item->'cups') not between 1 and 10 then raise exception 'Invalid cup count' using errcode='23514'; end if;
  sizes:=array[]::text[];
  for cup in select value from jsonb_array_elements(item->'cups') loop
   if length(btrim(coalesce(cup->>'size',''))) not between 1 and 60 or btrim(cup->>'size')=any(sizes) then raise exception 'Invalid cup size' using errcode='23514'; end if;
   sizes:=array_append(sizes,btrim(cup->>'size'));
   if not (cup ? 'cal') or jsonb_typeof(cup->'cal') not in ('null','number') then raise exception 'Invalid calories' using errcode='23514'; end if;
   if jsonb_typeof(cup->'cal')='number' and (cup->>'cal')::numeric not between 0 and 1000000 then raise exception 'Invalid calories' using errcode='23514'; end if;
   if jsonb_typeof(cup->'prices') is distinct from 'object' then raise exception 'Invalid prices' using errcode='23514'; end if;
   if (select count(*) from jsonb_object_keys(cup->'prices'))<>cardinality(region_ids) then raise exception 'Region price mismatch' using errcode='23514'; end if;
   foreach rid in array region_ids loop
    p:=cup->'prices'->rid;
    if p is null or jsonb_typeof(p->'available') is distinct from 'boolean' or not (p ? 'price') or jsonb_typeof(p->'price') not in ('null','number') then raise exception 'Invalid region price' using errcode='23514'; end if;
    if jsonb_typeof(p->'price')='number' and (p->>'price')::numeric not between 0 and 1000000 then raise exception 'Invalid price' using errcode='23514'; end if;
   end loop;
  end loop;
 end loop;
 return new;
end; $$;
revoke all on function tea_private.validate_menu_cms() from public,anon,authenticated;
create trigger validate_menu_cms before insert or update on public.menu_drafts
for each row execute function tea_private.validate_menu_cms();
