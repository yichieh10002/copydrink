revoke select on table public.menu_publications from anon;
grant select (store_key, document, published_at, is_current)
  on table public.menu_publications to anon;
notify pgrst, 'reload schema';
