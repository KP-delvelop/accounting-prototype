-- Purchase workflow: vendors, bills, bill lines, and accounts payable posting.

insert into public.accounting_accounts (company_id, code, name_lao, name_en, account_type, normal_side, opening_debit, opening_credit, source)
values
  ('11111111-1111-4111-8111-111111111111', '1200', null, 'Input Tax Receivable', 'Asset', 'debit', 0, 0, 'app_seed'),
  ('11111111-1111-4111-8111-111111111111', '2110', null, 'Accounts Payable', 'Liability', 'credit', 0, 0, 'app_seed')
on conflict (code) do nothing;

create table if not exists public.purchase_vendors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.app_companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  tax_id text,
  billing_address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.purchase_bills (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.app_companies(id) on delete cascade,
  vendor_id uuid not null references public.purchase_vendors(id),
  bill_no text not null,
  bill_date date not null default current_date,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'paid', 'void')),
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(14, 2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  posted_entry_no text references public.accounting_journal_entries(entry_no),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, bill_no),
  check (due_date >= bill_date),
  check (total_amount = subtotal + tax_amount)
);

create table if not exists public.purchase_bill_items (
  id bigserial primary key,
  bill_id uuid not null references public.purchase_bills(id) on delete cascade,
  line_no integer not null check (line_no > 0),
  account_code text not null references public.accounting_accounts(code),
  description text not null,
  quantity numeric(14, 2) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null check (unit_cost >= 0),
  line_total numeric(14, 2) generated always as (round(quantity * unit_cost, 2)) stored,
  created_at timestamptz not null default now(),
  unique (bill_id, line_no)
);

create index if not exists purchase_vendors_company_id_idx on public.purchase_vendors(company_id);
create index if not exists purchase_bills_company_id_idx on public.purchase_bills(company_id);
create index if not exists purchase_bills_vendor_id_idx on public.purchase_bills(vendor_id);
create index if not exists purchase_bill_items_bill_id_idx on public.purchase_bill_items(bill_id);

alter table public.purchase_vendors enable row level security;
alter table public.purchase_bills enable row level security;
alter table public.purchase_bill_items enable row level security;

drop policy if exists "Members can read purchase vendors" on public.purchase_vendors;
drop policy if exists "Accountants can insert purchase vendors" on public.purchase_vendors;
drop policy if exists "Accountants can update purchase vendors" on public.purchase_vendors;
drop policy if exists "Accountants can delete purchase vendors" on public.purchase_vendors;

create policy "Members can read purchase vendors"
on public.purchase_vendors
for select
to authenticated
using (private.current_user_company_role(company_id) is not null);

create policy "Accountants can insert purchase vendors"
on public.purchase_vendors
for insert
to authenticated
with check (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'));

create policy "Accountants can update purchase vendors"
on public.purchase_vendors
for update
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'))
with check (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'));

create policy "Accountants can delete purchase vendors"
on public.purchase_vendors
for delete
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'));

drop policy if exists "Members can read purchase bills" on public.purchase_bills;
drop policy if exists "Accountants can insert purchase bills" on public.purchase_bills;
drop policy if exists "Accountants can update purchase bills" on public.purchase_bills;
drop policy if exists "Accountants can delete purchase bills" on public.purchase_bills;

create policy "Members can read purchase bills"
on public.purchase_bills
for select
to authenticated
using (private.current_user_company_role(company_id) is not null);

create policy "Accountants can insert purchase bills"
on public.purchase_bills
for insert
to authenticated
with check (
  private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant')
  and exists (
    select 1
    from public.purchase_vendors vendors
    where vendors.id = purchase_bills.vendor_id
      and vendors.company_id = purchase_bills.company_id
  )
);

create policy "Accountants can update purchase bills"
on public.purchase_bills
for update
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'))
with check (
  private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant')
  and exists (
    select 1
    from public.purchase_vendors vendors
    where vendors.id = purchase_bills.vendor_id
      and vendors.company_id = purchase_bills.company_id
  )
);

create policy "Accountants can delete purchase bills"
on public.purchase_bills
for delete
to authenticated
using (
  private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant')
  and status = 'draft'
);

drop policy if exists "Members can read purchase bill items" on public.purchase_bill_items;
drop policy if exists "Accountants can insert purchase bill items" on public.purchase_bill_items;
drop policy if exists "Accountants can update purchase bill items" on public.purchase_bill_items;
drop policy if exists "Accountants can delete purchase bill items" on public.purchase_bill_items;

create policy "Members can read purchase bill items"
on public.purchase_bill_items
for select
to authenticated
using (
  exists (
    select 1
    from public.purchase_bills bills
    where bills.id = purchase_bill_items.bill_id
      and private.current_user_company_role(bills.company_id) is not null
  )
);

create policy "Accountants can insert purchase bill items"
on public.purchase_bill_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.purchase_bills bills
    join public.accounting_accounts accounts on accounts.code = purchase_bill_items.account_code
    where bills.id = purchase_bill_items.bill_id
      and bills.status = 'draft'
      and accounts.company_id = bills.company_id
      and private.current_user_company_role(bills.company_id) in ('owner', 'admin', 'accountant')
  )
);

create policy "Accountants can update purchase bill items"
on public.purchase_bill_items
for update
to authenticated
using (
  exists (
    select 1
    from public.purchase_bills bills
    where bills.id = purchase_bill_items.bill_id
      and bills.status = 'draft'
      and private.current_user_company_role(bills.company_id) in ('owner', 'admin', 'accountant')
  )
)
with check (
  exists (
    select 1
    from public.purchase_bills bills
    join public.accounting_accounts accounts on accounts.code = purchase_bill_items.account_code
    where bills.id = purchase_bill_items.bill_id
      and bills.status = 'draft'
      and accounts.company_id = bills.company_id
      and private.current_user_company_role(bills.company_id) in ('owner', 'admin', 'accountant')
  )
);

create policy "Accountants can delete purchase bill items"
on public.purchase_bill_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.purchase_bills bills
    where bills.id = purchase_bill_items.bill_id
      and bills.status = 'draft'
      and private.current_user_company_role(bills.company_id) in ('owner', 'admin', 'accountant')
  )
);

grant select, insert, update, delete on public.purchase_vendors to authenticated;
grant select, insert, update, delete on public.purchase_bills to authenticated;
grant select, insert, update, delete on public.purchase_bill_items to authenticated;
grant usage, select on sequence public.purchase_bill_items_id_seq to authenticated;
revoke all on public.purchase_vendors from anon;
revoke all on public.purchase_bills from anon;
revoke all on public.purchase_bill_items from anon;

create or replace function public.save_purchase_bill(
  target_bill_id uuid,
  target_company_id uuid,
  target_vendor_id uuid,
  target_bill_no text,
  target_bill_date date,
  target_due_date date,
  target_tax_amount numeric,
  target_notes text,
  target_items jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  existing_bill public.purchase_bills%rowtype;
  next_bill_id uuid;
  submitted_item_count integer;
  valid_item_count integer;
  item_subtotal numeric(14, 2);
  rounded_tax numeric(14, 2);
begin
  if private.current_user_company_role(target_company_id) not in ('owner', 'admin', 'accountant') then
    raise exception 'You cannot save purchase bills for this company.' using errcode = '42501';
  end if;

  if nullif(trim(target_bill_no), '') is null then
    raise exception 'Bill number is required.' using errcode = '23514';
  end if;

  if target_bill_date is null or target_due_date is null or target_due_date < target_bill_date then
    raise exception 'Bill dates are invalid.' using errcode = '23514';
  end if;

  if coalesce(target_tax_amount, 0) < 0 then
    raise exception 'Tax amount cannot be negative.' using errcode = '23514';
  end if;

  if coalesce(jsonb_typeof(target_items), '') <> 'array' then
    raise exception 'Bill items must be an array.' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.purchase_vendors vendors
    where vendors.id = target_vendor_id
      and vendors.company_id = target_company_id
      and vendors.status = 'active'
  ) then
    raise exception 'Vendor is not active for this company.' using errcode = '23514';
  end if;

  submitted_item_count := jsonb_array_length(target_items);

  with normalized_items as (
    select
      nullif(trim(item ->> 'accountCode'), '') as account_code,
      nullif(trim(item ->> 'description'), '') as description,
      coalesce(nullif(item ->> 'quantity', '')::numeric, 0) as quantity,
      coalesce(nullif(item ->> 'unitCost', '')::numeric, 0) as unit_cost
    from jsonb_array_elements(target_items) as raw_items(item)
  )
  select
    count(*) filter (
      where account_code is not null
        and description is not null
        and quantity > 0
        and unit_cost >= 0
        and exists (
          select 1
          from public.accounting_accounts accounts
          where accounts.code = normalized_items.account_code
            and accounts.company_id = target_company_id
        )
    ),
    coalesce(
      sum(round(quantity * unit_cost, 2)) filter (
        where account_code is not null
          and description is not null
          and quantity > 0
          and unit_cost >= 0
          and exists (
            select 1
            from public.accounting_accounts accounts
            where accounts.code = normalized_items.account_code
              and accounts.company_id = target_company_id
          )
      ),
      0
    )
  into valid_item_count, item_subtotal
  from normalized_items;

  if submitted_item_count = 0 or valid_item_count <> submitted_item_count then
    raise exception 'Every bill line needs a valid account, description, positive quantity, and non-negative unit cost.' using errcode = '23514';
  end if;

  if item_subtotal <= 0 then
    raise exception 'Bill subtotal must be greater than zero.' using errcode = '23514';
  end if;

  rounded_tax := round(coalesce(target_tax_amount, 0), 2);

  if target_bill_id is null then
    insert into public.purchase_bills (
      company_id,
      vendor_id,
      bill_no,
      bill_date,
      due_date,
      status,
      subtotal,
      tax_amount,
      total_amount,
      notes
    )
    values (
      target_company_id,
      target_vendor_id,
      trim(target_bill_no),
      target_bill_date,
      target_due_date,
      'draft',
      item_subtotal,
      rounded_tax,
      item_subtotal + rounded_tax,
      coalesce(target_notes, '')
    )
    returning id into next_bill_id;
  else
    select *
    into existing_bill
    from public.purchase_bills
    where id = target_bill_id
    for update;

    if existing_bill.id is null then
      raise exception 'Bill not found.' using errcode = 'P0002';
    end if;

    if existing_bill.company_id <> target_company_id then
      raise exception 'Bill does not belong to this company.' using errcode = '42501';
    end if;

    if existing_bill.status <> 'draft' then
      raise exception 'Only draft bills can be edited.' using errcode = '23514';
    end if;

    update public.purchase_bills
    set vendor_id = target_vendor_id,
        bill_no = trim(target_bill_no),
        bill_date = target_bill_date,
        due_date = target_due_date,
        subtotal = item_subtotal,
        tax_amount = rounded_tax,
        total_amount = item_subtotal + rounded_tax,
        notes = coalesce(target_notes, ''),
        updated_at = now()
    where id = target_bill_id
    returning id into next_bill_id;

    delete from public.purchase_bill_items
    where bill_id = next_bill_id;
  end if;

  insert into public.purchase_bill_items (bill_id, line_no, account_code, description, quantity, unit_cost)
  select
    next_bill_id,
    ordinality::integer,
    trim(item ->> 'accountCode'),
    trim(item ->> 'description'),
    (item ->> 'quantity')::numeric,
    (item ->> 'unitCost')::numeric
  from jsonb_array_elements(target_items) with ordinality as raw_items(item, ordinality);

  return next_bill_id;
end;
$$;

revoke all on function public.save_purchase_bill(uuid, uuid, uuid, text, date, date, numeric, text, jsonb) from public;
grant execute on function public.save_purchase_bill(uuid, uuid, uuid, text, date, date, numeric, text, jsonb) to authenticated;

create or replace function public.post_purchase_bill(target_bill_id uuid)
returns text
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  bill_row public.purchase_bills%rowtype;
  item_total numeric(14, 2);
  item_count integer;
  payable_line_no integer;
  next_entry_no text;
begin
  select *
  into bill_row
  from public.purchase_bills
  where id = target_bill_id
  for update;

  if bill_row.id is null then
    raise exception 'Bill not found.' using errcode = 'P0002';
  end if;

  if private.current_user_company_role(bill_row.company_id) not in ('owner', 'admin', 'accountant') then
    raise exception 'You cannot post bills for this company.' using errcode = '42501';
  end if;

  if bill_row.status <> 'draft' then
    raise exception 'Only draft bills can be posted.' using errcode = '23514';
  end if;

  select coalesce(sum(line_total), 0), count(*)::integer
  into item_total, item_count
  from public.purchase_bill_items
  where bill_id = target_bill_id;

  if item_total <= 0 or item_count = 0 then
    raise exception 'Bill requires at least one positive line item.' using errcode = '23514';
  end if;

  if item_total <> bill_row.subtotal then
    raise exception 'Bill subtotal does not match line items.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.purchase_bill_items items
    left join public.accounting_accounts accounts
      on accounts.code = items.account_code
     and accounts.company_id = bill_row.company_id
    where items.bill_id = target_bill_id
      and accounts.code is null
  ) then
    raise exception 'Bill contains an account outside this company.' using errcode = '23514';
  end if;

  next_entry_no := 'PB-' || bill_row.bill_no;

  insert into public.accounting_journal_entries (company_id, entry_no, entry_date, description, reference, status)
  values (
    bill_row.company_id,
    next_entry_no,
    bill_row.bill_date,
    'Purchase bill ' || bill_row.bill_no,
    bill_row.bill_no,
    'posted'
  );

  insert into public.accounting_journal_lines (entry_no, line_no, account_code, side, amount)
  select
    next_entry_no,
    items.line_no,
    items.account_code,
    'debit',
    items.line_total
  from public.purchase_bill_items items
  where items.bill_id = target_bill_id
  order by items.line_no;

  payable_line_no := item_count + 1;

  if bill_row.tax_amount > 0 then
    insert into public.accounting_journal_lines (entry_no, line_no, account_code, side, amount)
    values (next_entry_no, payable_line_no, '1200', 'debit', bill_row.tax_amount);

    payable_line_no := payable_line_no + 1;
  end if;

  insert into public.accounting_journal_lines (entry_no, line_no, account_code, side, amount)
  values (next_entry_no, payable_line_no, '2110', 'credit', bill_row.total_amount);

  update public.purchase_bills
  set status = 'approved',
      posted_entry_no = next_entry_no,
      updated_at = now()
  where id = target_bill_id;

  return next_entry_no;
end;
$$;

revoke all on function public.post_purchase_bill(uuid) from public;
grant execute on function public.post_purchase_bill(uuid) to authenticated;

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
  elsif tg_table_name = 'sales_customers' then
    audit_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    audit_entity_type := 'customer';
    audit_entity_id := case when tg_op = 'DELETE' then old.id else new.id end::text;
  elsif tg_table_name = 'sales_invoices' then
    audit_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    audit_entity_type := 'invoice';
    audit_entity_id := case when tg_op = 'DELETE' then old.invoice_no else new.invoice_no end;
  elsif tg_table_name = 'purchase_vendors' then
    audit_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    audit_entity_type := 'vendor';
    audit_entity_id := case when tg_op = 'DELETE' then old.id else new.id end::text;
  elsif tg_table_name = 'purchase_bills' then
    audit_company_id := case when tg_op = 'DELETE' then old.company_id else new.company_id end;
    audit_entity_type := 'purchase_bill';
    audit_entity_id := case when tg_op = 'DELETE' then old.bill_no else new.bill_no end;
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

drop trigger if exists audit_purchase_vendors on public.purchase_vendors;
create trigger audit_purchase_vendors
after insert or update or delete on public.purchase_vendors
for each row execute function private.capture_company_audit_event();

drop trigger if exists audit_purchase_bills on public.purchase_bills;
create trigger audit_purchase_bills
after insert or update or delete on public.purchase_bills
for each row execute function private.capture_company_audit_event();
