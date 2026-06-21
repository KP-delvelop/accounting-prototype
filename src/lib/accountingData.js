import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

function mapAccount(row) {
  return {
    companyId: row.company_id,
    code: row.code,
    nameLao: row.name_lao,
    nameEn: row.name_en,
    displayName: row.name_en,
    type: row.account_type,
    normalSide: row.normal_side,
    openingDebit: Number(row.opening_debit) || 0,
    openingCredit: Number(row.opening_credit) || 0,
    source: row.source,
  };
}

function mapJournalEntry(row, lines) {
  return {
    companyId: row.company_id,
    id: row.entry_no,
    date: row.entry_date,
    description: row.description ?? "",
    reference: row.reference ?? "",
    status: row.status,
    lines: lines
      .filter((line) => line.entry_no === row.entry_no)
      .sort((a, b) => a.line_no - b.line_no)
      .map((line) => ({
        account: line.account_code,
        side: line.side,
        amount: Number(line.amount) || 0,
      })),
  };
}

function mapTeamMember(row, profile = {}) {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    role: row.role,
    email: row.email ?? profile.email ?? "",
    displayName: row.display_name ?? profile.display_name ?? "",
    createdAt: row.created_at,
  };
}

function mapInvitation(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company?.name ?? "",
    email: row.email,
    role: row.role,
    status: row.status,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
  };
}

function mapAuditEvent(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    actorUserId: row.actor_user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    details: row.details ?? {},
    createdAt: row.created_at,
  };
}

function mapCustomer(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    billingAddress: row.billing_address ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapInvoice(row, items = []) {
  return {
    id: row.id,
    companyId: row.company_id,
    customerId: row.customer_id,
    customerName: row.customer?.name ?? "",
    invoiceNo: row.invoice_no,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    status: row.status,
    subtotal: Number(row.subtotal) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    postedEntryNo: row.posted_entry_no,
    notes: row.notes ?? "",
    items: items
      .filter((item) => item.invoice_id === row.id)
      .sort((a, b) => a.line_no - b.line_no)
      .map((item) => ({
        id: item.id,
        lineNo: item.line_no,
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unit_price) || 0,
        lineTotal: Number(item.line_total) || 0,
      })),
  };
}

function mapVendor(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    taxId: row.tax_id ?? "",
    billingAddress: row.billing_address ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapPurchaseBill(row, items = []) {
  return {
    id: row.id,
    companyId: row.company_id,
    vendorId: row.vendor_id,
    vendorName: row.vendor?.name ?? "",
    billNo: row.bill_no,
    billDate: row.bill_date,
    dueDate: row.due_date,
    status: row.status,
    subtotal: Number(row.subtotal) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    postedEntryNo: row.posted_entry_no,
    notes: row.notes ?? "",
    items: items
      .filter((item) => item.bill_id === row.id)
      .sort((a, b) => a.line_no - b.line_no)
      .map((item) => ({
        id: item.id,
        lineNo: item.line_no,
        accountCode: item.account_code,
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unitCost: Number(item.unit_cost) || 0,
        lineTotal: Number(item.line_total) || 0,
      })),
  };
}

export async function loadAccountingWorkspace() {
  if (!isSupabaseConfigured || !supabase) {
    return { configured: false };
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data: memberships, error: membershipError } = await supabase
    .from("app_company_members")
    .select("id,company_id,user_id,role,created_at,company:app_companies(id,name,base_currency,country_code,fiscal_year_start_month)")
    .eq("user_id", userResult.user.id)
    .order("created_at", { ascending: true });

  if (membershipError) throw membershipError;

  const activeMembership = memberships?.[0];
  const company = activeMembership?.company;

  if (!company) {
    const { data: availableInvitations, error: invitationError } = await supabase
      .from("app_company_invitations")
      .select("id,company_id,email,role,status,invited_by,created_at,company:app_companies(id,name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (invitationError) throw invitationError;

    return {
      configured: true,
      company: null,
      role: null,
      teamMembers: [],
      invitations: [],
      auditEvents: [],
      availableInvitations: (availableInvitations ?? []).map(mapInvitation),
      customers: [],
      invoices: [],
      vendors: [],
      purchaseBills: [],
      accounts: [],
      entries: [],
    };
  }

  const [
    accountsResult,
    entriesResult,
    linesResult,
    teamResult,
    invitationsResult,
    auditResult,
    customersResult,
    invoicesResult,
    invoiceItemsResult,
    vendorsResult,
    purchaseBillsResult,
    purchaseBillItemsResult,
  ] = await Promise.all([
    supabase
      .from("accounting_accounts")
      .select("*")
      .eq("company_id", company.id)
      .order("code", { ascending: true }),
    supabase
      .from("accounting_journal_entries")
      .select("*")
      .eq("company_id", company.id)
      .order("entry_date", { ascending: true }),
    supabase
      .from("accounting_journal_lines")
      .select("entry_no,line_no,account_code,side,amount")
      .order("entry_no", { ascending: true })
      .order("line_no", { ascending: true }),
    supabase
      .from("app_company_members")
      .select("id,company_id,user_id,role,created_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("app_company_invitations")
      .select("id,company_id,email,role,status,invited_by,created_at,company:app_companies(id,name)")
      .eq("company_id", company.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("app_audit_events")
      .select("id,company_id,actor_user_id,action,entity_type,entity_id,details,created_at")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("sales_customers")
      .select("id,company_id,name,email,phone,billing_address,status,created_at")
      .eq("company_id", company.id)
      .order("name", { ascending: true }),
    supabase
      .from("sales_invoices")
      .select("id,company_id,customer_id,invoice_no,issue_date,due_date,status,subtotal,tax_amount,total_amount,posted_entry_no,notes,customer:sales_customers(name)")
      .eq("company_id", company.id)
      .order("issue_date", { ascending: false }),
    supabase
      .from("sales_invoice_items")
      .select("id,invoice_id,line_no,description,quantity,unit_price,line_total")
      .order("line_no", { ascending: true }),
    supabase
      .from("purchase_vendors")
      .select("id,company_id,name,email,phone,tax_id,billing_address,status,created_at")
      .eq("company_id", company.id)
      .order("name", { ascending: true }),
    supabase
      .from("purchase_bills")
      .select("id,company_id,vendor_id,bill_no,bill_date,due_date,status,subtotal,tax_amount,total_amount,posted_entry_no,notes,vendor:purchase_vendors(name)")
      .eq("company_id", company.id)
      .order("bill_date", { ascending: false }),
    supabase
      .from("purchase_bill_items")
      .select("id,bill_id,line_no,account_code,description,quantity,unit_cost,line_total")
      .order("line_no", { ascending: true }),
  ]);

  const error =
    accountsResult.error ??
    entriesResult.error ??
    linesResult.error ??
    teamResult.error ??
    invitationsResult.error ??
    auditResult.error ??
    customersResult.error ??
    invoicesResult.error ??
    invoiceItemsResult.error ??
    vendorsResult.error ??
    purchaseBillsResult.error ??
    purchaseBillItemsResult.error;
  if (error) {
    throw error;
  }

  const teamRows = teamResult.data ?? [];
  const profileIds = [...new Set(teamRows.map((member) => member.user_id))];
  const profilesResult = profileIds.length
    ? await supabase.from("app_profiles").select("user_id,email,display_name").in("user_id", profileIds)
    : { data: [], error: null };

  if (profilesResult.error) throw profilesResult.error;

  const profilesById = new Map((profilesResult.data ?? []).map((profile) => [profile.user_id, profile]));

  return {
    configured: true,
    company: {
      id: company.id,
      name: company.name,
      baseCurrency: company.base_currency,
      countryCode: company.country_code,
      fiscalYearStartMonth: company.fiscal_year_start_month,
    },
    role: activeMembership.role,
    teamMembers: teamRows.map((member) => mapTeamMember(member, profilesById.get(member.user_id))),
    invitations: (invitationsResult.data ?? []).map(mapInvitation),
    auditEvents: (auditResult.data ?? []).map(mapAuditEvent),
    availableInvitations: [],
    customers: (customersResult.data ?? []).map(mapCustomer),
    invoices: (invoicesResult.data ?? []).map((invoice) => mapInvoice(invoice, invoiceItemsResult.data ?? [])),
    vendors: (vendorsResult.data ?? []).map(mapVendor),
    purchaseBills: (purchaseBillsResult.data ?? []).map((bill) => mapPurchaseBill(bill, purchaseBillItemsResult.data ?? [])),
    accounts: (accountsResult.data ?? []).map(mapAccount),
    entries: (entriesResult.data ?? []).map((entry) => mapJournalEntry(entry, linesResult.data ?? [])),
  };
}

export async function getCurrentSession() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthChange(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));

  return () => subscription.unsubscribe();
}

export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signUpWithEmail(email, password) {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function saveJournalEntry(entry) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!entry.companyId) throw new Error("No company is selected for this journal entry");

  const { error: entryError } = await supabase.from("accounting_journal_entries").upsert({
    company_id: entry.companyId,
    entry_no: entry.id,
    entry_date: entry.date,
    description: entry.description ?? "",
    reference: entry.reference ?? "",
    status: entry.status,
    updated_at: new Date().toISOString(),
  });

  if (entryError) throw entryError;

  const { error: deleteError } = await supabase
    .from("accounting_journal_lines")
    .delete()
    .eq("entry_no", entry.id);

  if (deleteError) throw deleteError;

  const rows = entry.lines.map((line, index) => ({
    entry_no: entry.id,
    line_no: index + 1,
    account_code: line.account,
    side: line.side,
    amount: Number(line.amount) || 0,
  }));

  const { error: linesError } = await supabase.from("accounting_journal_lines").insert(rows);
  if (linesError) throw linesError;
}

export async function voidJournalEntry(entry) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!entry.companyId) throw new Error("No company is selected for this journal entry");

  const { error } = await supabase
    .from("accounting_journal_entries")
    .update({ status: "void", updated_at: new Date().toISOString() })
    .eq("company_id", entry.companyId)
    .eq("entry_no", entry.id);

  if (error) throw error;
}

export async function saveAccount(account) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!account.companyId) throw new Error("No company is selected for this account");

  const { error } = await supabase.from("accounting_accounts").upsert({
    company_id: account.companyId,
    code: account.code,
    name_lao: account.nameLao || null,
    name_en: account.nameEn,
    account_type: account.type,
    normal_side: account.normalSide,
    opening_debit: Number(account.openingDebit) || 0,
    opening_credit: Number(account.openingCredit) || 0,
    source: account.source ?? "app",
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function deleteAccount(companyId, code) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("accounting_accounts")
    .delete()
    .eq("company_id", companyId)
    .eq("code", code);

  if (error) throw error;
}

export async function createCompanyInvitation(companyId, email, role) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("app_company_invitations")
    .upsert(
      {
        company_id: companyId,
        email,
        role,
        status: "pending",
        invited_by: userResult.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "company_id,email" },
    )
    .select("id,company_id,email,role,status,invited_by,created_at")
    .single();

  if (error) throw error;
  return mapInvitation(data);
}

export async function createCompanyForCurrentUser(name) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data: company, error: companyError } = await supabase
    .from("app_companies")
    .insert({ name, base_currency: "LAK", country_code: "LA" })
    .select("id,name,base_currency,country_code,fiscal_year_start_month")
    .single();

  if (companyError) throw companyError;

  const { error: memberError } = await supabase.from("app_company_members").insert({
    company_id: company.id,
    user_id: userResult.user.id,
    role: "owner",
  });

  if (memberError) throw memberError;
  return company;
}

export async function acceptCompanyInvitation(invitation) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { error } = await supabase.from("app_company_members").insert({
    company_id: invitation.companyId,
    user_id: userResult.user.id,
    role: invitation.role,
  });

  if (error) throw error;
}

export async function updateCompanyMemberRole(memberId, role) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("app_company_members")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", memberId)
    .select("id,company_id,user_id,role,created_at")
    .single();

  if (error) throw error;
  return mapTeamMember(data);
}

export async function removeCompanyMember(memberId) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { error } = await supabase
    .from("app_company_members")
    .delete()
    .eq("id", memberId);

  if (error) throw error;
}

export async function saveCustomer(customer) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!customer.companyId) throw new Error("No company is selected for this customer");

  const payload = {
    company_id: customer.companyId,
    name: customer.name,
    email: customer.email || null,
    phone: customer.phone || null,
    billing_address: customer.billingAddress || null,
    status: customer.status ?? "active",
    updated_at: new Date().toISOString(),
  };

  const query = customer.id
    ? supabase.from("sales_customers").update(payload).eq("id", customer.id)
    : supabase.from("sales_customers").insert(payload);

  const { data, error } = await query
    .select("id,company_id,name,email,phone,billing_address,status,created_at")
    .single();

  if (error) throw error;
  return mapCustomer(data);
}

export async function saveInvoice(invoice) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!invoice.companyId) throw new Error("No company is selected for this invoice");

  const rpcItems = invoice.items.map((item) => ({
    description: item.description,
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.unitPrice) || 0,
  }));

  const { data: invoiceId, error: rpcError } = await supabase.rpc("save_sales_invoice", {
    target_invoice_id: invoice.id ?? null,
    target_company_id: invoice.companyId,
    target_customer_id: invoice.customerId,
    target_invoice_no: invoice.invoiceNo,
    target_issue_date: invoice.issueDate,
    target_due_date: invoice.dueDate,
    target_tax_amount: Number(invoice.taxAmount) || 0,
    target_notes: invoice.notes ?? "",
    target_items: rpcItems,
  });

  if (rpcError) throw rpcError;

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("sales_invoices")
    .select("id,company_id,customer_id,invoice_no,issue_date,due_date,status,subtotal,tax_amount,total_amount,posted_entry_no,notes,customer:sales_customers(name)")
    .eq("id", invoiceId)
    .single();

  if (invoiceError) throw invoiceError;

  const { data: itemRows, error: itemError } = await supabase
    .from("sales_invoice_items")
    .select("id,invoice_id,line_no,description,quantity,unit_price,line_total")
    .eq("invoice_id", invoiceRow.id)
    .order("line_no", { ascending: true });

  if (itemError) throw itemError;
  return mapInvoice(invoiceRow, itemRows ?? []);
}

export async function postInvoice(invoiceId) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase.rpc("post_sales_invoice", {
    target_invoice_id: invoiceId,
  });

  if (error) throw error;
  return data;
}

export async function saveVendor(vendor) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!vendor.companyId) throw new Error("No company is selected for this vendor");

  const payload = {
    company_id: vendor.companyId,
    name: vendor.name,
    email: vendor.email || null,
    phone: vendor.phone || null,
    tax_id: vendor.taxId || null,
    billing_address: vendor.billingAddress || null,
    status: vendor.status ?? "active",
    updated_at: new Date().toISOString(),
  };

  const query = vendor.id
    ? supabase.from("purchase_vendors").update(payload).eq("id", vendor.id)
    : supabase.from("purchase_vendors").insert(payload);

  const { data, error } = await query
    .select("id,company_id,name,email,phone,tax_id,billing_address,status,created_at")
    .single();

  if (error) throw error;
  return mapVendor(data);
}

export async function savePurchaseBill(bill) {
  if (!supabase) throw new Error("Supabase is not configured");
  if (!bill.companyId) throw new Error("No company is selected for this bill");

  const rpcItems = bill.items.map((item) => ({
    accountCode: item.accountCode,
    description: item.description,
    quantity: Number(item.quantity) || 0,
    unitCost: Number(item.unitCost) || 0,
  }));

  const { data: billId, error: rpcError } = await supabase.rpc("save_purchase_bill", {
    target_bill_id: bill.id ?? null,
    target_company_id: bill.companyId,
    target_vendor_id: bill.vendorId,
    target_bill_no: bill.billNo,
    target_bill_date: bill.billDate,
    target_due_date: bill.dueDate,
    target_tax_amount: Number(bill.taxAmount) || 0,
    target_notes: bill.notes ?? "",
    target_items: rpcItems,
  });

  if (rpcError) throw rpcError;

  const { data: billRow, error: billError } = await supabase
    .from("purchase_bills")
    .select("id,company_id,vendor_id,bill_no,bill_date,due_date,status,subtotal,tax_amount,total_amount,posted_entry_no,notes,vendor:purchase_vendors(name)")
    .eq("id", billId)
    .single();

  if (billError) throw billError;

  const { data: itemRows, error: itemError } = await supabase
    .from("purchase_bill_items")
    .select("id,bill_id,line_no,account_code,description,quantity,unit_cost,line_total")
    .eq("bill_id", billRow.id)
    .order("line_no", { ascending: true });

  if (itemError) throw itemError;
  return mapPurchaseBill(billRow, itemRows ?? []);
}

export async function postPurchaseBill(billId) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase.rpc("post_purchase_bill", {
    target_bill_id: billId,
  });

  if (error) throw error;
  return data;
}
