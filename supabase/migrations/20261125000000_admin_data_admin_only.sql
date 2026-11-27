create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "Staff manage shared administrative data" on public.admin_data;

create policy "Administrators manage shared administrative data"
  on public.admin_data
  for all
  to authenticated
  using ((select public.current_user_is_admin()))
  with check (
    (select public.current_user_is_admin())
    and updated_by = (select auth.uid())
  );
