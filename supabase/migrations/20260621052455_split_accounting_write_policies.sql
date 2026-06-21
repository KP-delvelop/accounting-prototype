-- Avoid duplicate SELECT work by splitting write policies out of the prior
-- FOR ALL policies. Read access remains member-wide; writes remain limited to
-- owner/admin/accountant roles.

drop policy if exists "Accountants can manage accounts" on public.accounting_accounts;
drop policy if exists "Accountants can manage journal entries" on public.accounting_journal_entries;
drop policy if exists "Accountants can manage journal lines" on public.accounting_journal_lines;

create policy "Accountants can insert accounts"
on public.accounting_accounts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_accounts.company_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
);

create policy "Accountants can update accounts"
on public.accounting_accounts
for update
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

create policy "Accountants can delete accounts"
on public.accounting_accounts
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_accounts.company_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
);

create policy "Accountants can insert journal entries"
on public.accounting_journal_entries
for insert
to authenticated
with check (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_journal_entries.company_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
);

create policy "Accountants can update journal entries"
on public.accounting_journal_entries
for update
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

create policy "Accountants can delete journal entries"
on public.accounting_journal_entries
for delete
to authenticated
using (
  exists (
    select 1
    from public.app_company_members members
    where members.company_id = accounting_journal_entries.company_id
      and members.user_id = (select auth.uid())
      and members.role in ('owner', 'admin', 'accountant')
  )
);

create policy "Accountants can insert journal lines"
on public.accounting_journal_lines
for insert
to authenticated
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

create policy "Accountants can update journal lines"
on public.accounting_journal_lines
for update
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

create policy "Accountants can delete journal lines"
on public.accounting_journal_lines
for delete
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
);
