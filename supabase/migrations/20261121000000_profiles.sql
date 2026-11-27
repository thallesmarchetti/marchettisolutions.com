create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  display_name text not null default '',
  phone text not null default '',
  client_data jsonb not null default '{}'::jsonb,
  role text not null default 'client'
    check (role in ('client', 'technician', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, phone, client_data) on table public.profiles to authenticated;

create or replace function public.current_user_is_staff()
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
      and role in ('technician', 'admin')
  );
$$;

revoke all on function public.current_user_is_staff() from public, anon;
grant execute on function public.current_user_is_staff() to authenticated;

create policy "Users can read their own profile or staff profiles"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()) or (select public.current_user_is_staff()));

create policy "Users can update their own display name"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = coalesce(new.email, ''),
      display_name = coalesce(new.raw_user_meta_data ->> 'display_name', display_name),
      updated_at = now()
  where id = new.id;
  return new;
end;
$$;

revoke all on function public.handle_auth_user_updated() from public, anon, authenticated;

create or replace trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute procedure public.handle_auth_user_updated();

create table if not exists public.customer_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('ticket', 'invoice')),
  app_id text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, kind, app_id)
);

create index if not exists customer_records_owner_kind_idx
  on public.customer_records (owner_id, kind, created_at desc);

alter table public.customer_records enable row level security;
revoke all on table public.customer_records from anon, authenticated;
grant select, insert, delete on table public.customer_records to authenticated;
grant update on table public.customer_records to authenticated;

create policy "Customers read their records and staff read all records"
  on public.customer_records
  for select
  to authenticated
  using (owner_id = (select auth.uid()) or (select public.current_user_is_staff()));

create policy "Customers create their own tickets and staff create records"
  on public.customer_records
  for insert
  to authenticated
  with check (
    (owner_id = (select auth.uid()) and kind = 'ticket' and data ->> 'status' = 'pending')
    or (select public.current_user_is_staff())
  );

create policy "Customers delete their tickets and staff manage all records"
  on public.customer_records
  for delete
  to authenticated
  using (
    (owner_id = (select auth.uid()) and kind = 'ticket' and data ->> 'status' = 'pending')
    or (select public.current_user_is_staff())
  );

create policy "Staff update customer records"
  on public.customer_records
  for update
  to authenticated
  using ((select public.current_user_is_staff()))
  with check ((select public.current_user_is_staff()));

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_created_at_idx
  on public.audit_events (created_at desc);

alter table public.audit_events enable row level security;
revoke all on table public.audit_events from anon, authenticated;
grant select, insert on table public.audit_events to authenticated;

create policy "Staff read audit events"
  on public.audit_events
  for select
  to authenticated
  using ((select public.current_user_is_staff()));

create policy "Staff write audit events as themselves"
  on public.audit_events
  for insert
  to authenticated
  with check (
    actor_id = (select auth.uid())
    and (select public.current_user_is_staff())
  );

create table if not exists public.admin_data (
  key text primary key,
  value jsonb not null,
  updated_by uuid not null references auth.users (id),
  updated_at timestamptz not null default now()
);

alter table public.admin_data enable row level security;
revoke all on table public.admin_data from anon, authenticated;
grant select, insert, update, delete on table public.admin_data to authenticated;

create policy "Staff manage shared administrative data"
  on public.admin_data
  for all
  to authenticated
  using ((select public.current_user_is_staff()))
  with check (
    (select public.current_user_is_staff())
    and updated_by = (select auth.uid())
  );
