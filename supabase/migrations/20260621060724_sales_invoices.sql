-- Sales workflow: customers, invoices, invoice lines, and invoice posting.

insert into public.accounting_accounts (company_id, code, name_lao, name_en, account_type, normal_side, opening_debit, opening_credit, source)
values
  ('11111111-1111-4111-8111-111111111111', '1100', null, 'Accounts Receivable', 'Asset', 'debit', 0, 0, 'app_seed'),
  ('11111111-1111-4111-8111-111111111111', '2200', null, 'Tax Payable', 'Liability', 'credit', 0, 0, 'app_seed')
on conflict (code) do nothing;

create table if not exists public.sales_customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.app_companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  billing_address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.app_companies(id) on delete cascade,
  customer_id uuid not null references public.sales_customers(id),
  invoice_no text not null,
  issue_date date not null default current_date,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'void')),
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  tax_amount numeric(14, 2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  posted_entry_no text references public.accounting_journal_entries(entry_no),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, invoice_no),
  check (due_date >= issue_date),
  check (total_amount = subtotal + tax_amount)
);

create table if not exists public.sales_invoice_items (
  id bigserial primary key,
  invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  line_no integer not null check (line_no > 0),
  description text not null,
  quantity numeric(14, 2) not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  line_total numeric(14, 2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now(),
  unique (invoice_id, line_no)
);

create index if not exists sales_customers_company_id_idx on public.sales_customers(company_id);
create index if not exists sales_invoices_company_id_idx on public.sales_invoices(company_id);
create index if not exists sales_invoices_customer_id_idx on public.sales_invoices(customer_id);
create index if not exists sales_invoice_items_invoice_id_idx on public.sales_invoice_items(invoice_id);

alter table public.sales_customers enable row level security;
alter table public.sales_invoices enable row level security;
alter table public.sales_invoice_items enable row level security;

drop policy if exists "Members can read sales customers" on public.sales_customers;
drop policy if exists "Accountants can insert sales customers" on public.sales_customers;
drop policy if exists "Accountants can update sales customers" on public.sales_customers;
drop policy if exists "Accountants can delete sales customers" on public.sales_customers;

create policy "Members can read sales customers"
on public.sales_customers
for select
to authenticated
using (private.current_user_company_role(company_id) is not null);

create policy "Accountants can insert sales customers"
on public.sales_customers
for insert
to authenticated
with check (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'));

create policy "Accountants can update sales customers"
on public.sales_customers
for update
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'))
with check (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'));

create policy "Accountants can delete sales customers"
on public.sales_customers
for delete
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'));

drop policy if exists "Members can read sales invoices" on public.sales_invoices;
drop policy if exists "Accountants can insert sales invoices" on public.sales_invoices;
drop policy if exists "Accountants can update sales invoices" on public.sales_invoices;
drop policy if exists "Accountants can delete sales invoices" on public.sales_invoices;

create policy "Members can read sales invoices"
on public.sales_invoices
for select
to authenticated
using (private.current_user_company_role(company_id) is not null);

create policy "Accountants can insert sales invoices"
on public.sales_invoices
for insert
to authenticated
with check (
  private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant')
  and exists (
    select 1
    from public.sales_customers customers
    where customers.id = sales_invoices.customer_id
      and customers.company_id = sales_invoices.company_id
  )
);

create policy "Accountants can update sales invoices"
on public.sales_invoices
for update
to authenticated
using (private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant'))
with check (
  private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant')
  and exists (
    select 1
    from public.sales_customers customers
    where customers.id = sales_invoices.customer_id
      and customers.company_id = sales_invoices.company_id
  )
);

create policy "Accountants can delete sales invoices"
on public.sales_invoices
for delete
to authenticated
using (
  private.current_user_company_role(company_id) in ('owner', 'admin', 'accountant')
  and status = 'draft'
);

drop policy if exists "Members can read sales invoice items" on public.sales_invoice_items;
drop policy if exists "Accountants can insert sales invoice items" on public.sales_invoice_items;
drop policy if exists "Accountants can update sales invoice items" on public.sales_invoice_items;
drop policy if exists "Accountants can delete sales invoice items" on public.sales_invoice_items;

create policy "Members can read sales invoice items"
on public.sales_invoice_items
for select
to authenticated
using (
  exists (
    select 1
    from public.sales_invoices invoices
    where invoices.id = sales_invoice_items.invoice_id
      and private.current_user_company_role(invoices.company_id) is not null
  )
);

create policy "Accountants can insert sales invoice items"
on public.sales_invoice_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sales_invoices invoices
    where invoices.id = sales_invoice_items.invoice_id
      and invoices.status = 'draft'
      and private.current_user_company_role(invoices.company_id) in ('owner', 'admin', 'accountant')
  )
);

create policy "Accountants can update sales invoice items"
on public.sales_invoice_items
for update
to authenticated
using (
  exists (
    select 1
    from public.sales_invoices invoices
    where invoices.id = sales_invoice_items.invoice_id
      and invoices.status = 'draft'
      and private.current_user_company_role(invoices.company_id) in ('owner', 'admin', 'accountant')
  )
)
with check (
  exists (
    select 1
    from public.sales_invoices invoices
    where invoices.id = sales_invoice_items.invoice_id
      and invoices.status = 'draft'
      and private.current_user_company_role(invoices.company_id) in ('owner', 'admin', 'accountant')
  )
);

create policy "Accountants can delete sales invoice items"
on public.sales_invoice_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.sales_invoices invoices
    where invoices.id = sales_invoice_items.invoice_id
      and invoices.status = 'draft'
      and private.current_user_company_role(invoices.company_id) in ('owner', 'admin', 'accountant')
  )
);

grant select, insert, update, delete on public.sales_customers to authenticated;
grant select, insert, update, delete on public.sales_invoices to authenticated;
grant select, insert, update, delete on public.sales_invoice_items to authenticated;
grant usage, select on sequence public.sales_invoice_items_id_seq to authenticated;
revoke all on public.sales_customers from anon;
revoke all on public.sales_invoices from anon;
revoke all on public.sales_invoice_items from anon;

create or replace function public.save_sales_invoice(
  target_invoice_id uuid,
  target_company_id uuid,
  target_customer_id uuid,
  target_invoice_no text,
  target_issue_date date,
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
  existing_invoice public.sales_invoices%rowtype;
  next_invoice_id uuid;
  submitted_item_count integer;
  valid_item_count integer;
  item_subtotal numeric(14, 2);
  rounded_tax numeric(14, 2);
begin
  if private.current_user_company_role(target_company_id) not in ('owner', 'admin', 'accountant') then
    raise exception 'You cannot save sales invoices for this company.' using errcode = '42501';
  end if;

  if nullif(trim(target_invoice_no), '') is null then
    raise exception 'Invoice number is required.' using errcode = '23514';
  end if;

  if target_issue_date is null or target_due_date is null or target_due_date < target_issue_date then
    raise exception 'Invoice dates are invalid.' using errcode = '23514';
  end if;

  if coalesce(target_tax_amount, 0) < 0 then
    raise exception 'Tax amount cannot be negative.' using errcode = '23514';
  end if;

  if coalesce(jsonb_typeof(target_items), '') <> 'array' then
    raise exception 'Invoice items must be an array.' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.sales_customers customers
    where customers.id = target_customer_id
      and customers.company_id = target_company_id
      and customers.status = 'active'
  ) then
    raise exception 'Customer is not active for this company.' using errcode = '23514';
  end if;

  submitted_item_count := jsonb_array_length(target_items);

  with normalized_items as (
    select
      nullif(trim(item ->> 'description'), '') as description,
      coalesce(nullif(item ->> 'quantity', '')::numeric, 0) as quantity,
      coalesce(nullif(item ->> 'unitPrice', '')::numeric, 0) as unit_price
    from jsonb_array_elements(target_items) as raw_items(item)
  )
  select
    count(*) filter (where description is not null and quantity > 0 and unit_price >= 0),
    coalesce(
      sum(round(quantity * unit_price, 2)) filter (where description is not null and quantity > 0 and unit_price >= 0),
      0
    )
  into valid_item_count, item_subtotal
  from normalized_items;

  if submitted_item_count = 0 or valid_item_count <> submitted_item_count then
    raise exception 'Every invoice line needs a description, positive quantity, and non-negative unit price.' using errcode = '23514';
  end if;

  if item_subtotal <= 0 then
    raise exception 'Invoice subtotal must be greater than zero.' using errcode = '23514';
  end if;

  rounded_tax := round(coalesce(target_tax_amount, 0), 2);

  if target_invoice_id is null then
    insert into public.sales_invoices (
      company_id,
      customer_id,
      invoice_no,
      issue_date,
      due_date,
      status,
      subtotal,
      tax_amount,
      total_amount,
      notes
    )
    values (
      target_company_id,
      target_customer_id,
      trim(target_invoice_no),
      target_issue_date,
      target_due_date,
      'draft',
      item_subtotal,
      rounded_tax,
      item_subtotal + rounded_tax,
      coalesce(target_notes, '')
    )
    returning id into next_invoice_id;
  else
    select *
    into existing_invoice
    from public.sales_invoices
    where id = target_invoice_id
    for update;

    if existing_invoice.id is null then
      raise exception 'Invoice not found.' using errcode = 'P0002';
    end if;

    if existing_invoice.company_id <> target_company_id then
      raise exception 'Invoice does not belong to this company.' using errcode = '42501';
    end if;

    if existing_invoice.status <> 'draft' then
      raise exception 'Only draft invoices can be edited.' using errcode = '23514';
    end if;

    update public.sales_invoices
    set customer_id = target_customer_id,
        invoice_no = trim(target_invoice_no),
        issue_date = target_issue_date,
        due_date = target_due_date,
        subtotal = item_subtotal,
        tax_amount = rounded_tax,
        total_amount = item_subtotal + rounded_tax,
        notes = coalesce(target_notes, ''),
        updated_at = now()
    where id = target_invoice_id
    returning id into next_invoice_id;

    delete from public.sales_invoice_items
    where invoice_id = next_invoice_id;
  end if;

  insert into public.sales_invoice_items (invoice_id, line_no, description, quantity, unit_price)
  select
    next_invoice_id,
    ordinality::integer,
    trim(item ->> 'description'),
    (item ->> 'quantity')::numeric,
    (item ->> 'unitPrice')::numeric
  from jsonb_array_elements(target_items) with ordinality as raw_items(item, ordinality);

  return next_invoice_id;
end;
$$;

revoke all on function public.save_sales_invoice(uuid, uuid, uuid, text, date, date, numeric, text, jsonb) from public;
grant execute on function public.save_sales_invoice(uuid, uuid, uuid, text, date, date, numeric, text, jsonb) to authenticated;

create or replace function public.post_sales_invoice(target_invoice_id uuid)
returns text
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  invoice_row public.sales_invoices%rowtype;
  item_total numeric(14, 2);
  next_entry_no text;
begin
  select *
  into invoice_row
  from public.sales_invoices
  where id = target_invoice_id
  for update;

  if invoice_row.id is null then
    raise exception 'Invoice not found.' using errcode = 'P0002';
  end if;

  if private.current_user_company_role(invoice_row.company_id) not in ('owner', 'admin', 'accountant') then
    raise exception 'You cannot post invoices for this company.' using errcode = '42501';
  end if;

  if invoice_row.status <> 'draft' then
    raise exception 'Only draft invoices can be posted.' using errcode = '23514';
  end if;

  select coalesce(sum(line_total), 0)
  into item_total
  from public.sales_invoice_items
  where invoice_id = target_invoice_id;

  if item_total <= 0 then
    raise exception 'Invoice requires at least one positive line item.' using errcode = '23514';
  end if;

  if item_total <> invoice_row.subtotal then
    raise exception 'Invoice subtotal does not match line items.' using errcode = '23514';
  end if;

  next_entry_no := 'SI-' || invoice_row.invoice_no;

  insert into public.accounting_journal_entries (company_id, entry_no, entry_date, description, reference, status)
  values (
    invoice_row.company_id,
    next_entry_no,
    invoice_row.issue_date,
    'Sales invoice ' || invoice_row.invoice_no,
    invoice_row.invoice_no,
    'posted'
  );

  insert into public.accounting_journal_lines (entry_no, line_no, account_code, side, amount)
  values
    (next_entry_no, 1, '1100', 'debit', invoice_row.total_amount),
    (next_entry_no, 2, '7000', 'credit', invoice_row.subtotal);

  if invoice_row.tax_amount > 0 then
    insert into public.accounting_journal_lines (entry_no, line_no, account_code, side, amount)
    values (next_entry_no, 3, '2200', 'credit', invoice_row.tax_amount);
  end if;

  update public.sales_invoices
  set status = 'sent',
      posted_entry_no = next_entry_no,
      updated_at = now()
  where id = target_invoice_id;

  return next_entry_no;
end;
$$;

revoke all on function public.post_sales_invoice(uuid) from public;
grant execute on function public.post_sales_invoice(uuid) to authenticated;

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

drop trigger if exists audit_sales_customers on public.sales_customers;
create trigger audit_sales_customers
after insert or update or delete on public.sales_customers
for each row execute function private.capture_company_audit_event();

drop trigger if exists audit_sales_invoices on public.sales_invoices;
create trigger audit_sales_invoices
after insert or update or delete on public.sales_invoices
for each row execute function private.capture_company_audit_event();
