-- Add profile records and safe team-management primitives.
-- Public RPCs are explicitly granted only to authenticated users and verify the
-- caller's company role before mutating memberships.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.app_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_profiles (user_id, email, display_name, created_at, updated_at)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'full_name', split_part(users.email, '@', 1)),
  users.created_at,
  now()
from auth.users
where users.email is not null
on conflict (user_id) do update set
  email = excluded.email,
  display_name = coalesce(excluded.display_name, public.app_profiles.display_name),
  updated_at = now();

create or replace function private.sync_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.app_profiles (user_id, email, display_name, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    now()
  )
  on conflict (user_id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.app_profiles.display_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function private.sync_user_profile();

create or replace function private.current_user_company_role(target_company_id uuid)
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select members.role
  from public.app_company_members members
  where members.company_id = target_company_id
    and members.user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function private.current_user_company_role(uuid) from public;
grant execute on function private.current_user_company_role(uuid) to authenticated;

alter table public.app_profiles enable row level security;

drop policy if exists "Company members can read profiles" on public.app_profiles;
drop policy if exists "Users can update their own profile" on public.app_profiles;

create policy "Company members can read profiles"
on public.app_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.app_company_members viewer
    join public.app_company_members colleague on colleague.company_id = viewer.company_id
    where viewer.user_id = (select auth.uid())
      and colleague.user_id = app_profiles.user_id
  )
);

create policy "Users can update their own profile"
on public.app_profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Members can read their own memberships" on public.app_company_members;
drop policy if exists "Members can read company memberships" on public.app_company_members;
drop policy if exists "Admins can insert memberships" on public.app_company_members;
drop policy if exists "Admins can update memberships" on public.app_company_members;
drop policy if exists "Admins can delete memberships" on public.app_company_members;

create policy "Members can read company memberships"
on public.app_company_members
for select
to authenticated
using (private.current_user_company_role(company_id) is not null);

create policy "Admins can insert memberships"
on public.app_company_members
for insert
to authenticated
with check (private.current_user_company_role(company_id) in ('owner', 'admin'));

create policy "Admins can update memberships"
on public.app_company_members
for update
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin'))
with check (private.current_user_company_role(company_id) in ('owner', 'admin'));

create policy "Admins can delete memberships"
on public.app_company_members
for delete
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin'));

grant select, update on public.app_profiles to authenticated;
grant select, insert, update, delete on public.app_company_members to authenticated;

create or replace function public.add_company_member_by_email(
  target_company_id uuid,
  target_email text,
  target_role text
)
returns table (
  id uuid,
  company_id uuid,
  user_id uuid,
  role text,
  email text,
  display_name text
)
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  caller_role text;
  target_user_id uuid;
begin
  caller_role := private.current_user_company_role(target_company_id);

  if caller_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can add team members.' using errcode = '42501';
  end if;

  if target_role not in ('owner', 'admin', 'accountant', 'reviewer', 'viewer') then
    raise exception 'Invalid company role.' using errcode = '22023';
  end if;

  select profiles.user_id
  into target_user_id
  from public.app_profiles profiles
  where lower(profiles.email) = lower(trim(target_email));

  if target_user_id is null then
    raise exception 'No confirmed user profile exists for this email yet.' using errcode = 'P0002';
  end if;

  insert into public.app_company_members (company_id, user_id, role)
  values (target_company_id, target_user_id, target_role)
  on conflict (company_id, user_id) do update set
    role = excluded.role,
    updated_at = now();

  return query
  select members.id, members.company_id, members.user_id, members.role, profiles.email, profiles.display_name
  from public.app_company_members members
  join public.app_profiles profiles on profiles.user_id = members.user_id
  where members.company_id = target_company_id
    and members.user_id = target_user_id;
end;
$$;

create or replace function public.update_company_member_role(
  target_membership_id uuid,
  target_role text
)
returns table (
  id uuid,
  company_id uuid,
  user_id uuid,
  role text,
  email text,
  display_name text
)
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  membership public.app_company_members%rowtype;
  caller_role text;
  owner_count integer;
begin
  if target_role not in ('owner', 'admin', 'accountant', 'reviewer', 'viewer') then
    raise exception 'Invalid company role.' using errcode = '22023';
  end if;

  select *
  into membership
  from public.app_company_members
  where app_company_members.id = target_membership_id;

  if membership.id is null then
    raise exception 'Membership not found.' using errcode = 'P0002';
  end if;

  caller_role := private.current_user_company_role(membership.company_id);
  if caller_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can change roles.' using errcode = '42501';
  end if;

  select count(*)
  into owner_count
  from public.app_company_members
  where app_company_members.company_id = membership.company_id
    and app_company_members.role = 'owner';

  if membership.role = 'owner' and target_role <> 'owner' and owner_count <= 1 then
    raise exception 'At least one owner is required.' using errcode = '23514';
  end if;

  update public.app_company_members
  set role = target_role,
      updated_at = now()
  where app_company_members.id = target_membership_id;

  return query
  select members.id, members.company_id, members.user_id, members.role, profiles.email, profiles.display_name
  from public.app_company_members members
  join public.app_profiles profiles on profiles.user_id = members.user_id
  where members.id = target_membership_id;
end;
$$;

create or replace function public.remove_company_member(target_membership_id uuid)
returns void
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  membership public.app_company_members%rowtype;
  caller_role text;
  owner_count integer;
begin
  select *
  into membership
  from public.app_company_members
  where app_company_members.id = target_membership_id;

  if membership.id is null then
    return;
  end if;

  caller_role := private.current_user_company_role(membership.company_id);
  if caller_role not in ('owner', 'admin') then
    raise exception 'Only owners and admins can remove team members.' using errcode = '42501';
  end if;

  select count(*)
  into owner_count
  from public.app_company_members
  where app_company_members.company_id = membership.company_id
    and app_company_members.role = 'owner';

  if membership.role = 'owner' and owner_count <= 1 then
    raise exception 'At least one owner is required.' using errcode = '23514';
  end if;

  delete from public.app_company_members
  where app_company_members.id = target_membership_id;
end;
$$;

revoke all on function public.add_company_member_by_email(uuid, text, text) from public;
revoke all on function public.update_company_member_role(uuid, text) from public;
revoke all on function public.remove_company_member(uuid) from public;

grant execute on function public.add_company_member_by_email(uuid, text, text) to authenticated;
grant execute on function public.update_company_member_role(uuid, text) to authenticated;
grant execute on function public.remove_company_member(uuid) to authenticated;
