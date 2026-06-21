-- Let new users either create their first company or accept a pending invite.

create or replace function private.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select profiles.email
  from public.app_profiles profiles
  where profiles.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.company_member_count(target_company_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.app_company_members members
  where members.company_id = target_company_id;
$$;

revoke all on function private.current_user_email() from public;
revoke all on function private.company_member_count(uuid) from public;
grant execute on function private.current_user_email() to authenticated;
grant execute on function private.company_member_count(uuid) to authenticated;

drop policy if exists "Members can read their companies" on public.app_companies;
drop policy if exists "Members and invitees can read companies" on public.app_companies;

create policy "Members and invitees can read companies"
on public.app_companies
for select
to authenticated
using (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = app_companies.id
      and members.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.app_company_invitations invitations
    where invitations.company_id = app_companies.id
      and lower(invitations.email) = lower(private.current_user_email())
      and invitations.status = 'pending'
  )
);

drop policy if exists "Authenticated users can create companies" on public.app_companies;
drop policy if exists "Admins can update their companies" on public.app_companies;

create policy "Authenticated users can create companies"
on public.app_companies
for insert
to authenticated
with check ((select auth.uid()) is not null);

create policy "Admins can update their companies"
on public.app_companies
for update
to authenticated
using (private.current_user_company_role(id) in ('owner', 'admin'))
with check (private.current_user_company_role(id) in ('owner', 'admin'));

grant insert, update on public.app_companies to authenticated;

drop policy if exists "Admins can insert memberships" on public.app_company_members;
drop policy if exists "Authorized membership inserts" on public.app_company_members;

create policy "Authorized membership inserts"
on public.app_company_members
for insert
to authenticated
with check (
  private.current_user_company_role(company_id) in ('owner', 'admin')
  or (
    user_id = (select auth.uid())
    and role = 'owner'
    and private.company_member_count(company_id) = 0
  )
  or (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.app_company_invitations invitations
      where invitations.company_id = app_company_members.company_id
        and lower(invitations.email) = lower(private.current_user_email())
        and invitations.role = app_company_members.role
        and invitations.status = 'pending'
    )
  )
);

drop policy if exists "Members can read company invitations" on public.app_company_invitations;
drop policy if exists "Company members and invitees can read invitations" on public.app_company_invitations;

create policy "Company members and invitees can read invitations"
on public.app_company_invitations
for select
to authenticated
using (
  private.current_user_company_role(company_id) is not null
  or lower(email) = lower(private.current_user_email())
);

create or replace function private.mark_invitation_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_email text;
begin
  select profiles.email
  into member_email
  from public.app_profiles profiles
  where profiles.user_id = new.user_id;

  update public.app_company_invitations
  set status = 'accepted',
      updated_at = now()
  where company_id = new.company_id
    and lower(email) = lower(member_email)
    and role = new.role
    and status = 'pending';

  return new;
end;
$$;

drop trigger if exists app_company_members_accept_invite on public.app_company_members;
create trigger app_company_members_accept_invite
after insert on public.app_company_members
for each row execute function private.mark_invitation_accepted();
