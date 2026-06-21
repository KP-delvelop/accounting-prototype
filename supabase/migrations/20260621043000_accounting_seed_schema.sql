-- Accounting prototype schema and seed data.
-- Generated from src/App.jsx and src/data/excelSeed.js on 2026-06-21.

create table if not exists public.accounting_accounts (
  code text primary key,
  name_lao text,
  name_en text not null,
  account_type text not null check (account_type in ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  normal_side text not null check (normal_side in ('debit', 'credit')),
  opening_debit numeric(14, 2) not null default 0 check (opening_debit >= 0),
  opening_credit numeric(14, 2) not null default 0 check (opening_credit >= 0),
  source text not null default 'prototype',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounting_journal_entries (
  entry_no text primary key,
  entry_date date not null,
  description text not null default '',
  reference text not null default '',
  status text not null check (status in ('posted', 'review', 'draft', 'void')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounting_journal_lines (
  id bigserial primary key,
  entry_no text not null references public.accounting_journal_entries(entry_no) on delete cascade,
  line_no integer not null check (line_no > 0),
  account_code text not null references public.accounting_accounts(code),
  side text not null check (side in ('debit', 'credit')),
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (entry_no, line_no)
);

create table if not exists public.accounting_workbook_sheets (
  id bigserial primary key,
  source_file text not null,
  sheet_name text not null,
  dimension text not null,
  value_count integer not null check (value_count >= 0),
  created_at timestamptz not null default now(),
  unique (source_file, sheet_name)
);

create table if not exists public.accounting_raw_import_entries (
  source_entry_no text primary key,
  source_file text not null,
  description text not null default '',
  payload jsonb not null,
  import_order integer not null,
  created_at timestamptz not null default now()
);

alter table public.accounting_accounts enable row level security;
alter table public.accounting_journal_entries enable row level security;
alter table public.accounting_journal_lines enable row level security;
alter table public.accounting_workbook_sheets enable row level security;
alter table public.accounting_raw_import_entries enable row level security;

drop policy if exists "Public read accounts" on public.accounting_accounts;
drop policy if exists "Public read journal entries" on public.accounting_journal_entries;
drop policy if exists "Public read journal lines" on public.accounting_journal_lines;
drop policy if exists "Public read workbook sheets" on public.accounting_workbook_sheets;
drop policy if exists "Public read raw import entries" on public.accounting_raw_import_entries;

create policy "Public read accounts" on public.accounting_accounts for select to anon using (true);
create policy "Public read journal entries" on public.accounting_journal_entries for select to anon using (true);
create policy "Public read journal lines" on public.accounting_journal_lines for select to anon using (true);
create policy "Public read workbook sheets" on public.accounting_workbook_sheets for select to anon using (true);
create policy "Public read raw import entries" on public.accounting_raw_import_entries for select to anon using (true);

grant select on public.accounting_accounts to anon;
grant select on public.accounting_journal_entries to anon;
grant select on public.accounting_journal_lines to anon;
grant select on public.accounting_workbook_sheets to anon;
grant select on public.accounting_raw_import_entries to anon;

grant select, insert, update, delete on public.accounting_accounts to authenticated;
grant select, insert, update, delete on public.accounting_journal_entries to authenticated;
grant select, insert, update, delete on public.accounting_journal_lines to authenticated;
grant select, insert, update, delete on public.accounting_workbook_sheets to authenticated;
grant select, insert, update, delete on public.accounting_raw_import_entries to authenticated;

grant usage, select on all sequences in schema public to authenticated;

insert into public.accounting_accounts (code, name_lao, name_en, account_type, normal_side, opening_debit, opening_credit, source)
values
  ('1011', 'ເງິນສົດເປັນກີບ', 'Cash in LAK', 'Asset', 'debit', 8075000, 0, 'excel_seed'),
  ('1012', 'ເງິນສົດເປັນເງິນຕ່າງປະເທດ', 'Cash in foreign currency', 'Asset', 'debit', 895000, 0, 'excel_seed'),
  ('1013', 'ເງິນສົດຍ່ອຍ', 'Petty cash', 'Asset', 'debit', 140000, 0, 'excel_seed'),
  ('1014', 'ເງິນສົດກຳລັງນຳຝາກ', 'Cash in transit', 'Asset', 'debit', 100000, 0, 'excel_seed'),
  ('1017', 'ເງິນສົດລ່ວງໜ້າ', 'Cash advance', 'Asset', 'debit', 10000, 0, 'excel_seed'),
  ('1021', 'ເງິນຝາກທະນາຄານເປັນກີບ', 'Bank deposits in LAK', 'Asset', 'debit', 23510000, 0, 'excel_seed'),
  ('1022', 'ເງິນຝາກທະນາຄານເປັນເງິນຕ່າງປະເທດ', 'Bank deposits in foreign currency', 'Asset', 'debit', 6345000, 0, 'excel_seed'),
  ('2000', null, 'Accounts Payable', 'Liability', 'credit', 0, 7850000, 'prototype'),
  ('2100', null, 'Bank Loan', 'Liability', 'credit', 0, 4250000, 'prototype'),
  ('3000', null, 'Owner''s Equity', 'Equity', 'credit', 0, 20000000, 'prototype'),
  ('7000', null, 'Service Revenue', 'Revenue', 'credit', 0, 9800000, 'prototype'),
  ('6200', null, 'Office Supplies', 'Expense', 'debit', 1250000, 0, 'prototype'),
  ('6400', null, 'Administrative Expense', 'Expense', 'debit', 1575000, 0, 'prototype')
on conflict (code) do update set
  name_lao = excluded.name_lao,
  name_en = excluded.name_en,
  account_type = excluded.account_type,
  normal_side = excluded.normal_side,
  opening_debit = excluded.opening_debit,
  opening_credit = excluded.opening_credit,
  source = excluded.source,
  updated_at = now();

insert into public.accounting_journal_entries (entry_no, entry_date, description, reference, status)
values
  ('JV-2025-0502-001', '2025-05-02', 'Bank loan received', 'BNK-0502', 'posted'),
  ('JV-2025-0508-002', '2025-05-08', 'Customer payment for monthly service', 'INV-2025-052', 'posted'),
  ('JV-2025-0512-003', '2025-05-12', 'Administrative expenses paid', 'EXP-0512', 'posted'),
  ('JV-2025-0518-004', '2025-05-18', '', 'EXP-0518', 'review'),
  ('JV-2025-0522-005', '2025-05-22', 'Customer receipt entered from bank statement', 'BNK-0522', 'review')
on conflict (entry_no) do update set
  entry_date = excluded.entry_date,
  description = excluded.description,
  reference = excluded.reference,
  status = excluded.status,
  updated_at = now();

delete from public.accounting_journal_lines
where entry_no in ('JV-2025-0502-001', 'JV-2025-0508-002', 'JV-2025-0512-003', 'JV-2025-0518-004', 'JV-2025-0522-005');

insert into public.accounting_journal_lines (entry_no, line_no, account_code, side, amount)
values
  ('JV-2025-0502-001', 1, '1021', 'debit', 4250000),
  ('JV-2025-0502-001', 2, '2100', 'credit', 4250000),
  ('JV-2025-0508-002', 1, '1011', 'debit', 9800000),
  ('JV-2025-0508-002', 2, '7000', 'credit', 9800000),
  ('JV-2025-0512-003', 1, '6400', 'debit', 1575000),
  ('JV-2025-0512-003', 2, '1011', 'credit', 1575000),
  ('JV-2025-0518-004', 1, '6200', 'debit', 1250000),
  ('JV-2025-0518-004', 2, '1011', 'credit', 1250000),
  ('JV-2025-0522-005', 1, '1011', 'debit', 5600000),
  ('JV-2025-0522-005', 2, '7000', 'credit', 5000000);

insert into public.accounting_workbook_sheets (source_file, sheet_name, dimension, value_count)
values
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Chart', 'A1:G661', 3626),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'GL', 'A1:K1824', 8150),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Balance Be', 'A1:L666', 5888),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'GL2', 'A2:I2108', 16686),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'B RP', 'A1:H294', 1170),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Balance Af', 'A1:L661', 7421),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'IC acc', 'A1:F32', 75),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Taxxx', 'A2:J22', 43),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'ICtax', 'A1:E31', 74),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'DS', 'A1:E32', 93),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'SS', 'A1:G37', 104),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Direct CF', 'A1:D37', 44),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Ind CF', 'A1:D36', 42),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Equity', 'A1:G21', 28),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Tecnic ACC', 'A1:N428', 1178),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Remember', 'A1:G651', 22),
  ('D:\Download\ACC  Exprogram Test Apr20.xlsx', 'Change Equity', 'A1:G22', 64)
on conflict (source_file, sheet_name) do update set
  dimension = excluded.dimension,
  value_count = excluded.value_count;

insert into public.accounting_raw_import_entries (source_entry_no, source_file, description, payload, import_order)
values
  ('JV-2025-001', 'D:\Download\ACC  Exprogram Test Apr20.xlsx', '​ເວ​ລາ​ເອົາ​ເງິນ​ໃຫ້​ພາກ​ສ່ວນ​ອື່ນ ກູ້​ຢືມ', '{"id":"JV-2025-001","description":"​ເວ​ລາ​ເອົາ​ເງິນ​ໃຫ້​ພາກ​ສ່ວນ​ອື່ນ ກູ້​ຢືມ","lines":[{"account":"1111","side":"debit","amount":250000},{"account":"1011","side":"credit","amount":50000},{"account":"1012","side":"credit","amount":100000},{"account":"1021","side":"credit","amount":80000},{"account":"1022","side":"credit","amount":20000}]}'::jsonb, 1),
  ('JV-2025-002', 'D:\Download\ACC  Exprogram Test Apr20.xlsx', 'ເວ​ລາ​ພາກ​ສ່ວນ​ອື່ນ ເອົາ​ເງິນ​ມາ​ທົດ​ແທນ', '{"id":"JV-2025-002","description":"ເວ​ລາ​ພາກ​ສ່ວນ​ອື່ນ ເອົາ​ເງິນ​ມາ​ທົດ​ແທນ","lines":[{"account":"1011","side":"debit","amount":30000},{"account":"1012","side":"debit","amount":80000},{"account":"1021","side":"debit","amount":55000},{"account":"1022","side":"debit","amount":15000},{"account":"1111","side":"credit","amount":170000},{"account":"1118","side":"credit","amount":10000}]}'::jsonb, 2),
  ('JV-2025-003', 'D:\Download\ACC  Exprogram Test Apr20.xlsx', 'ເວ​ລາ​ໄດ້​ຮັບ​ໃບ​ຢັ້ງ​ຢືນ​ໜີ້ ຈາກ​ພາກ​ສ່ວນ​ອື່ນ', '{"id":"JV-2025-003","description":"ເວ​ລາ​ໄດ້​ຮັບ​ໃບ​ຢັ້ງ​ຢືນ​ໜີ້ ຈາກ​ພາກ​ສ່ວນ​ອື່ນ","lines":[{"account":"1112","side":"debit","amount":120000},{"account":"1116","side":"credit","amount":20000},{"account":"112","side":"credit","amount":80000},{"account":"1136","side":"credit","amount":20000}]}'::jsonb, 3),
  ('JV-2025-004', 'D:\Download\ACC  Exprogram Test Apr20.xlsx', 'ເວ​ລາ​ພາກ​ສ່ວນ​ອື່ນ ນຳ​ເງິນ​ມາ​ທົດ​ແທນ ຕາມ​ສັນ​ຍາ​ໃບ​ຢັ້ງ​ຢືນ​ໜີ້', '{"id":"JV-2025-004","description":"ເວ​ລາ​ພາກ​ສ່ວນ​ອື່ນ ນຳ​ເງິນ​ມາ​ທົດ​ແທນ ຕາມ​ສັນ​ຍາ​ໃບ​ຢັ້ງ​ຢືນ​ໜີ້","lines":[{"account":"1011","side":"debit","amount":20000},{"account":"1012","side":"debit","amount":15000},{"account":"1021","side":"debit","amount":30000},{"account":"1022","side":"debit","amount":20000},{"account":"1112","side":"credit","amount":80000},{"account":"1118","side":"credit","amount":5000}]}'::jsonb, 4),
  ('JV-2025-005', 'D:\Download\ACC  Exprogram Test Apr20.xlsx', 'ເວ​ລາ​ຊື້​ຮຸ້ນ​ສາ​ມັນ ນຳ​ບໍ​ລິ​ສັດ​ອື່ນ', '{"id":"JV-2025-005","description":"ເວ​ລາ​ຊື້​ຮຸ້ນ​ສາ​ມັນ ນຳ​ບໍ​ລິ​ສັດ​ອື່ນ","lines":[{"account":"1113","side":"debit","amount":100000},{"account":"1021","side":"credit","amount":100000}]}'::jsonb, 5),
  ('JV-2025-006', 'D:\Download\ACC  Exprogram Test Apr20.xlsx', 'ເວ​ລາ​ຂາຍ​ຮຸ້ນ​ສາ​ມັນ ອອກ', '{"id":"JV-2025-006","description":"ເວ​ລາ​ຂາຍ​ຮຸ້ນ​ສາ​ມັນ ອອກ","lines":[{"account":"1021","side":"debit","amount":120000},{"account":"1113","side":"credit","amount":100000},{"account":"766","side":"credit","amount":20000}]}'::jsonb, 6)
on conflict (source_entry_no) do update set
  source_file = excluded.source_file,
  description = excluded.description,
  payload = excluded.payload,
  import_order = excluded.import_order;
