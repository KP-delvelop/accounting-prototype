-- Company-scoped audit history for core accounting and team changes.

create table if not exists public.app_audit_events (
  id bigserial primary key,
  company_id uuid not null references public.app_companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_audit_events_company_created_idx
  on public.app_audit_events(company_id, created_at desc);

alter table public.app_audit_events enable row level security;

drop policy if exists "Members can read audit events" on public.app_audit_events;

create policy "Members can read audit events"
on public.app_audit_events
for select
to authenticated
using (private.current_user_company_role(company_id) is not null);

grant select on public.app_audit_events to authenticated;
grant usage, select on sequence public.app_audit_events_id_seq to authenticated;
revoke all on public.app_audit_events from anon;

create or replace function private.capture_company_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  audit_company_id uuid;
  audit_entity_type text;
  audit_entity_id text;
  audit_details jsonb;
begin
  if tg_table_name = 'accounting_accounts' then
    audit_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    audit_entity_type := 'account';
    audit_entity_id := case when tg_op = 'DELETE' then old.code else new.code end;
  elsif tg_table_name = 'accounting_journal_entries' then
    audit_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    audit_entity_type := 'journal_entry';
    audit_entity_id := case when tg_op = 'DELETE' then old.entry_no else new.entry_no end;
  elsif tg_table_name = 'app_company_members' then
    audit_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    audit_entity_type := 'team_member';
    audit_entity_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end::text;
  elsif tg_table_name = 'app_company_invitations' then
    audit_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    audit_entity_type := 'invitation';
    audit_entity_id := case when tg_op = 'DELETE' then old.email else new.email end;
  else
    raise exception 'Unsupported audit table: %', tg_table_name;
  end if;

  audit_details := jsonb_build_object(
    'old', case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    'new', case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  insert into public.app_audit_events (company_id, actor_user_id, action, entity_type, entity_id, details)
  values (audit_company_id, (select auth.uid()), lower(tg_op), audit_entity_type, audit_entity_id, audit_details);

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists audit_accounting_accounts on public.accounting_accounts;
create trigger audit_accounting_accounts
after insert or update or delete on public.accounting_accounts
for each row execute function private.capture_company_audit_event();

drop trigger if exists audit_accounting_journal_entries on public.accounting_journal_entries;
create trigger audit_accounting_journal_entries
after insert or update or delete on public.accounting_journal_entries
for each row execute function private.capture_company_audit_event();

drop trigger if exists audit_app_company_members on public.app_company_members;
create trigger audit_app_company_members
after insert or update or delete on public.app_company_members
for each row execute function private.capture_company_audit_event();

drop trigger if exists audit_app_company_invitations on public.app_company_invitations;
create trigger audit_app_company_invitations
after insert or update or delete on public.app_company_invitations
for each row execute function private.capture_company_audit_event();
