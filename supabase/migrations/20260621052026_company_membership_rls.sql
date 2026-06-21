-- Add the first production-style workspace boundary.
-- Ledger rows are now scoped to a company, and access depends on membership.

create table if not exists public.app_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency text not null default 'LAK',
  country_code text not null default 'LA',
  fiscal_year_start_month integer not null default 1 check (fiscal_year_start_month between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.app_companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'accountant', 'reviewer', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

insert into public.app_companies (id, name, base_currency, country_code, fiscal_year_start_month)
values ('11111111-1111-4111-8111-111111111111', 'Rabbitwork Demo Company', 'LAK', 'LA', 1)
on conflict (id) do update set
  name = excluded.name,
  base_currency = excluded.base_currency,
  country_code = excluded.country_code,
  fiscal_year_start_month = excluded.fiscal_year_start_month,
  updated_at = now();

insert into public.app_company_members (company_id, user_id, role)
select '11111111-1111-4111-8111-111111111111', users.id, 'owner'
from auth.users
where users.email = 'rabbitwork.demo.mqnc3thv.2ead@gmail.com'
on conflict (company_id, user_id) do update set
  role = excluded.role,
  updated_at = now();

alter table public.accounting_accounts
  add column if not exists company_id uuid references public.app_companies(id) on delete cascade;

alter table public.accounting_journal_entries
  add column if not exists company_id uuid references public.app_companies(id) on delete cascade;

update public.accounting_accounts
set company_id = '11111111-1111-4111-8111-111111111111'
where company_id is null;

update public.accounting_journal_entries
set company_id = '11111111-1111-4111-8111-111111111111'
where company_id is null;

alter table public.accounting_accounts
  alter column company_id set not null,
  alter column company_id set default '11111111-1111-4111-8111-111111111111';

alter table public.accounting_journal_entries
  alter column company_id set not null,
  alter column company_id set default '11111111-1111-4111-8111-111111111111';

create index if not exists accounting_accounts_company_id_idx
  on public.accounting_accounts(company_id);

create index if not exists accounting_journal_entries_company_id_idx
  on public.accounting_journal_entries(company_id);

create index if not exists app_company_members_user_id_idx
  on public.app_company_members(user_id);

create index if not exists app_company_members_company_id_idx
  on public.app_company_members(company_id);

alter table public.app_companies enable row level security;
alter table public.app_company_members enable row level security;

drop policy if exists "Members can read their companies" on public.app_companies;
drop policy if exists "Members can read their own memberships" on public.app_company_members;

create policy "Members can read their companies"
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
);

create policy "Members can read their own memberships"
on public.app_company_members
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Public read accounts" on public.accounting_accounts;
drop policy if exists "Public read journal entries" on public.accounting_journal_entries;
drop policy if exists "Public read journal lines" on public.accounting_journal_lines;
drop policy if exists "Authenticated write journal entries" on public.accounting_journal_entries;
drop policy if exists "Authenticated write journal lines" on public.accounting_journal_lines;

drop policy if exists "Members can read accounts" on public.accounting_accounts;
drop policy if exists "Accountants can manage accounts" on public.accounting_accounts;
drop policy if exists "Members can read journal entries" on public.accounting_journal_entries;
drop policy if exists "Accountants can manage journal entries" on public.accounting_journal_entries;
drop policy if exists "Members can read journal lines" on public.accounting_journal_lines;
drop policy if exists "Accountants can manage journal lines" on public.accounting_journal_lines;

create policy "Members can read accounts"
on public.accounting_accounts
for select
to authenticated
using (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_accounts.company_id
      and members.user_id = (select auth.uid())
  )
);

create policy "Accountants can manage accounts"
on public.accounting_accounts
for all
to authenticated
using (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_accounts.company_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
)
with check (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_accounts.company_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
);

create policy "Members can read journal entries"
on public.accounting_journal_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_journal_entries.company_id
      and members.user_id = (select auth.uid())
  )
);

create policy "Accountants can manage journal entries"
on public.accounting_journal_entries
for all
to authenticated
using (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_journal_entries.company_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
)
with check (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_journal_entries.company_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
);

create policy "Members can read journal lines"
on public.accounting_journal_lines
for select
to authenticated
using (
  exists (
    select 1
    from public.accounting_journal_entries entries
    join public.app_company_members members on members.company_id = entries.company_id
    where entries.entry_no = accounting_journal_lines.entry_no
      and members.user_id = (select auth.uid())
  )
);

create policy "Accountants can manage journal lines"
on public.accounting_journal_lines
for all
to authenticated
using (
  exists (
    select 1
    from public.accounting_journal_entries entries
    join public.app_company_members members on members.company_id = entries.company_id
    where entries.entry_no = accounting_journal_lines.entry_no
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
)
with check (
  exists (
    select 1
    from public.accounting_journal_entries entries
    join public.app_company_members members on members.company_id = entries.company_id
    where entries.entry_no = accounting_journal_lines.entry_no
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
);

revoke all on public.app_companies from anon;
revoke all on public.app_company_members from anon;
revoke all on public.accounting_accounts from anon;
revoke all on public.accounting_journal_entries from anon;
revoke all on public.accounting_journal_lines from anon;
revoke all on public.accounting_workbook_sheets from anon;
revoke all on public.accounting_raw_import_entries from anon;

grant select on public.app_companies to authenticated;
grant select on public.app_company_members to authenticated;
grant select, insert, update, delete on public.accounting_accounts to authenticated;
grant select, insert, update, delete on public.accounting_journal_entries to authenticated;
grant select, insert, update, delete on public.accounting_journal_lines to authenticated;
