-- Allow signed-in users to manage journal data.
-- Company/member-scoped authorization will replace these broad authenticated
-- policies when the product model adds workspaces and roles.

drop policy if exists "Authenticated write journal entries" on public.accounting_journal_entries;
drop policy if exists "Authenticated write journal lines" on public.accounting_journal_lines;

create policy "Authenticated write journal entries"
on public.accounting_journal_entries
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated write journal lines"
on public.accounting_journal_lines
for all
to authenticated
using (true)
with check (true);

grant usage, select on sequence public.accounting_journal_lines_id_seq to authenticated;
