begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','c8785803-4299-4d2b-8e78-caf3a944b7c5',true);
do $$
declare d jsonb; original jsonb; bad jsonb; before_revision bigint; copy_price numeric;
begin
 select document,revision into d,before_revision from public.menu_drafts where store_key='menu-dezheng';
 original:=d;
 d:=jsonb_set(d,'{regions}',(d->'regions') || '[{"id":"north","name":"北部","enabled":true}]'::jsonb);
 select jsonb_set(d,'{items}',jsonb_agg(
  jsonb_set(item,'{cups}',(select jsonb_agg(jsonb_set(cup,'{prices,north}',cup->'prices'->'source')) from jsonb_array_elements(item->'cups') as c(cup)))
 )) into d from jsonb_array_elements(d->'items') as i(item);
 d:=jsonb_set(d,'{items,0,cups,0,prices,north,price}','0');
 update public.menu_drafts set document=d where store_key='menu-dezheng' and revision=before_revision;
 if not found then raise exception 'valid admin save failed'; end if;
 select (document#>>'{items,0,cups,0,prices,source,price}')::numeric into copy_price from public.menu_drafts where store_key='menu-dezheng';
 if copy_price <> (original#>>'{items,0,cups,0,prices,source,price}')::numeric then raise exception 'region edit changed source'; end if;
 bad:=jsonb_set(d,'{items,0,cups,0,prices,north,price}','-1');
 begin update public.menu_drafts set document=bad where store_key='menu-dezheng';raise exception 'negative price accepted';exception when check_violation then null;end;
 bad:=jsonb_set(d,'{items,0,cups,0,prices}',(d#>'{items,0,cups,0,prices}') - 'north');
 begin update public.menu_drafts set document=bad where store_key='menu-dezheng';raise exception 'missing regional price accepted';exception when check_violation then null;end;
 bad:=jsonb_set(d,'{regions,1,name}',d#>'{regions,0,name}');
 begin update public.menu_drafts set document=bad where store_key='menu-dezheng';raise exception 'duplicate region accepted';exception when check_violation then null;end;
 update public.menu_drafts set document=d where store_key='menu-dezheng' and revision=before_revision;
 if found then raise exception 'stale update accepted';end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ declare n integer; begin select count(*) into n from public.menu_drafts;if n<>0 then raise exception 'nonadmin accessed drafts';end if;end $$;
reset role;
select 'PASS: real database regional clone/save, zero, source independence, invalid price/schema rejection, CAS, RLS' as result;
rollback;
