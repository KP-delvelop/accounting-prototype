-- Replace public SECURITY DEFINER team RPCs with RLS-protected direct writes
-- and pending invitations. The only SECURITY DEFINER helper remains in the
-- private schema, where it is not exposed as a REST RPC.

drop function if exists public.add_company_member_by_email(uuid, text, text);
drop function if exists public.update_company_member_role(uuid, text);
drop function if exists public.remove_company_member(uuid);

create table if not exists public.app_company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.app_companies(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'accountant', 'reviewer', 'viewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, email)
);

alter table public.app_company_invitations enable row level security;

drop policy if exists "Members can read company invitations" on public.app_company_invitations;
drop policy if exists "Admins can create invitations" on public.app_company_invitations;
drop policy if exists "Admins can update invitations" on public.app_company_invitations;
drop policy if exists "Admins can delete invitations" on public.app_company_invitations;

create policy "Members can read company invitations"
on public.app_company_invitations
for select
to authenticated
using (private.current_user_company_role(company_id) is not null);

create policy "Admins can create invitations"
on public.app_company_invitations
for insert
to authenticated
with check (
  private.current_user_company_role(company_id) in ('owner', 'admin')
  and invited_by = (select auth.uid())
);

create policy "Admins can update invitations"
on public.app_company_invitations
for update
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin'))
with check (private.current_user_company_role(company_id) in ('owner', 'admin'));

create policy "Admins can delete invitations"
on public.app_company_invitations
for delete
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin'));

grant select, insert, update, delete on public.app_company_invitations to authenticated;
revoke all on public.app_company_invitations from anon;

create or replace function private.prevent_last_owner_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  owner_count integer;
begin
  if tg_op = 'UPDATE' and old.role = 'owner' and new.role = 'owner' then
    return new;
  end if;

  if (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner')
     or (tg_op = 'DELETE' and old.role = 'owner') then
    select count(*)
    into owner_count
    from public.app_company_members
    where company_id = old.company_id
      and role = 'owner';

    if owner_count <= 1 then
      raise exception 'At least one owner is required.' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists app_company_members_owner_guard on public.app_company_members;
create trigger app_company_members_owner_guard
before update or delete on public.app_company_members
for each row execute function private.prevent_last_owner_change();
