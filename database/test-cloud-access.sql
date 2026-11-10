begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','c8785803-4299-4d2b-8e78-caf3a944b7c5',true);
insert into public.menu_drafts(store_key, document) values ('connection-test-rls-probe','{"brand":{"name":"得正"},"items":[]}');
do $$ declare n integer; rev bigint; begin
 update public.menu_drafts set document='{"brand":{"name":"得正"},"items":[{"name":"權限測試"}]}' where store_key='connection-test-rls-probe' and revision=1;
 get diagnostics n = row_count;
 if n <> 1 then raise exception 'admin_update_failed'; end if;
 select revision into rev from public.menu_drafts where store_key='connection-test-rls-probe';
 if rev <> 2 then raise exception 'revision_failed'; end if;
 update public.menu_drafts set document='{"brand":{"name":"得正"},"items":[]}' where store_key='connection-test-rls-probe' and revision=1;
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'stale_write_allowed'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
do $$ declare n integer; begin
 select count(*) into n from public.menu_drafts;
 if n <> 0 then raise exception 'nonadmin_read_allowed'; end if;
 begin
  insert into public.menu_drafts(store_key,document) values ('nonadmin-probe','{"brand":{"name":"x"},"items":[]}');
  raise exception 'nonadmin_insert_allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.menu_admins(user_id) values ('00000000-0000-0000-0000-000000000001');
  raise exception 'self_promotion_allowed';
 exception when insufficient_privilege then null; end;
 update public.menu_drafts set document='{"brand":{"name":"x"},"items":[]}' where store_key='connection-test-rls-probe';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'nonadmin_update_allowed'; end if;
end $$;
set local role anon;
do $$ begin
 begin perform 1 from public.menu_drafts; raise exception 'anon_read_allowed';
 exception when insufficient_privilege then null; end;
 begin insert into public.menu_drafts(store_key,document) values ('anon-probe','{"brand":{"name":"x"},"items":[]}'); raise exception 'anon_write_allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: admin read/write, version conflict, nonadmin isolation, no self-promotion, anonymous denial' as result;
rollback;
