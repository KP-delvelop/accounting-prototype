-- Tighten the temporary authenticated write policies so every mutation is tied
-- to a real Supabase Auth user. Future company/member RLS will narrow this to
-- workspace membership and role permissions.

drop policy if exists "Authenticated write journal entries" on public.accounting_journal_entries;
drop policy if exists "Authenticated write journal lines" on public.accounting_journal_lines;

create policy "Authenticated write journal entries"
on public.accounting_journal_entries
for all
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);

create policy "Authenticated write journal lines"
on public.accounting_journal_lines
for all
to authenticated
using ((select auth.uid()) is not null)
with check ((select auth.uid()) is not null);
