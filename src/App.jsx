import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  History,
  Landmark,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCcw,
  Scale,
  Settings,
  Table2,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  acceptCompanyInvitation,
  createCompanyInvitation,
  createCompanyForCurrentUser,
  deleteAccount,
  getCurrentSession,
  loadAccountingWorkspace,
  onAuthChange,
  removeCompanyMember,
  saveAccount,
  saveCustomer,
  saveInvoice,
  saveJournalEntry,
  savePurchaseBill,
  saveVendor,
  postInvoice,
  postPurchaseBill,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateCompanyMemberRole,
  voidJournalEntry,
} from "./lib/accountingData.js";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "journal", label: "Journal", icon: ReceiptText },
  { id: "sales", label: "Sales", icon: FileText },
  { id: "purchases", label: "Purchases", icon: ClipboardList },
  { id: "accounts", label: "Chart of Accounts", icon: Table2 },
  { id: "trial", label: "Trial Balance", icon: Scale },
  { id: "reports", label: "Reports", icon: FileSpreadsheet },
  { id: "team", label: "Team", icon: Users },
  { id: "audit", label: "Audit", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

const blankDraft = {
  date: "2025-05-31",
  description: "Office supplies purchase",
  reference: "EXP-0531",
  debitAccount: "6200",
  creditAccount: "1011",
  debit: 1250000,
  credit: 1250000,
};

const pageTitles = {
  dashboard: "Dashboard",
  journal: "Journal",
  sales: "Sales",
  purchases: "Purchases",
  accounts: "Chart of Accounts",
  trial: "Trial Balance",
  reports: "Reports",
  team: "Team",
  audit: "Audit",
  settings: "Settings",
};

const roleOptions = ["owner", "admin", "accountant", "reviewer", "viewer"];
const accountTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
const normalSides = ["debit", "credit"];

const defaultUserSettings = {
  darkMode: false,
  compactMode: false,
  largeText: false,
};

function loadStoredUserSettings() {
  try {
    const stored = window.localStorage.getItem("accounting-user-settings");
    return stored ? { ...defaultUserSettings, ...JSON.parse(stored) } : defaultUserSettings;
  } catch {
    return defaultUserSettings;
  }
}

const blankAccount = {
  code: "",
  nameEn: "",
  nameLao: "",
  type: "Asset",
  normalSide: "debit",
  openingDebit: 0,
  openingCredit: 0,
};

const blankMemberInvite = {
  email: "",
  role: "viewer",
};

const blankCustomer = {
  name: "",
  email: "",
  phone: "",
  billingAddress: "",
  status: "active",
};

const blankInvoiceItem = {
  description: "Monthly service",
  quantity: 1,
  unitPrice: 9800000,
};

function blankInvoice(customers = [], invoices = []) {
  return {
    invoiceNo: nextInvoiceNo(invoices),
    customerId: customers[0]?.id ?? "",
    issueDate: "2025-05-31",
    dueDate: "2025-06-30",
    taxAmount: 0,
    notes: "",
    items: [{ ...blankInvoiceItem }],
  };
}

const blankVendor = {
  name: "",
  email: "",
  phone: "",
  taxId: "",
  billingAddress: "",
  status: "active",
};

const blankPurchaseBillItem = {
  accountCode: "6200",
  description: "Office supplies",
  quantity: 1,
  unitCost: 1250000,
};

function blankPurchaseBill(vendors = [], bills = [], accounts = []) {
  const defaultAccount = accounts.find((account) => account.type === "Expense")?.code ?? blankPurchaseBillItem.accountCode;
  return {
    billNo: nextBillNo(bills),
    vendorId: vendors[0]?.id ?? "",
    billDate: "2025-05-31",
    dueDate: "2025-06-30",
    taxAmount: 0,
    notes: "",
    items: [{ ...blankPurchaseBillItem, accountCode: defaultAccount }],
  };
}

function formatKip(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0));
}

function money(value) {
  return `LAK ${formatKip(value)}`;
}

function compactMoney(value) {
  const number = Number(value) || 0;
  if (Math.abs(number) >= 1000000) return `LAK ${(number / 1000000).toFixed(1)}M`;
  return money(number);
}

function entryTotals(entry) {
  return entry.lines.reduce(
    (totals, line) => {
      const amount = Number(line.amount) || 0;
      if (line.side === "debit") totals.debit += amount;
      if (line.side === "credit") totals.credit += amount;
      return totals;
    },
    { debit: 0, credit: 0 },
  );
}

function analyzeEntry(entry, accountsByCode) {
  const totals = entryTotals(entry);
  const issues = [];

  if (!entry.description.trim()) issues.push("Missing description");
  if (Math.abs(totals.debit - totals.credit) > 0.005) issues.push("Unbalanced entry");
  if (totals.debit <= 0 || totals.credit <= 0) issues.push("Missing amount");
  if (entry.lines.some((line) => !accountsByCode.has(line.account))) issues.push("Unknown account");

  return {
    ...totals,
    difference: Math.abs(totals.debit - totals.credit),
    issues,
    canPost: issues.length === 0,
  };
}

function buildAccountRows(accounts, entries) {
  const rowsByCode = new Map(
    accounts.map((account) => [
      account.code,
      {
        ...account,
        debit: Number(account.openingDebit) || 0,
        credit: Number(account.openingCredit) || 0,
      },
    ]),
  );

  entries
    .filter((entry) => entry.status === "posted")
    .forEach((entry) => {
      entry.lines.forEach((line) => {
        const row = rowsByCode.get(line.account);
        if (!row) return;
        const amount = Number(line.amount) || 0;
        if (line.side === "debit") row.debit += amount;
        if (line.side === "credit") row.credit += amount;
      });
    });

  return Array.from(rowsByCode.values()).map((row) => {
    const netDebit = Math.max(row.debit - row.credit, 0);
    const netCredit = Math.max(row.credit - row.debit, 0);
    const balance = row.normalSide === "credit" ? row.credit - row.debit : row.debit - row.credit;
    return { ...row, netDebit, netCredit, balance };
  });
}

function buildTrialRows(accountRows) {
  const labels = {
    Asset: "Assets",
    Liability: "Liabilities",
    Equity: "Equity",
    Revenue: "Revenue",
    Expense: "Expenses",
  };
  const order = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"];
  const rows = new Map(order.map((label) => [label, { label, debit: 0, credit: 0 }]));

  accountRows.forEach((account) => {
    const label = labels[account.type] ?? account.type;
    if (!rows.has(label)) rows.set(label, { label, debit: 0, credit: 0 });
    rows.get(label).debit += account.netDebit;
    rows.get(label).credit += account.netCredit;
  });

  return Array.from(rows.values()).filter((row) => row.debit > 0 || row.credit > 0);
}

function draftToEntry(draft, id, status, companyId = null) {
  return {
    companyId,
    id,
    date: draft.date,
    description: draft.description,
    reference: draft.reference,
    status,
    lines: [
      { account: draft.debitAccount, side: "debit", amount: Number(draft.debit) || 0 },
      { account: draft.creditAccount, side: "credit", amount: Number(draft.credit) || 0 },
    ],
  };
}

function nextJournalId(entries) {
  return `JV-2025-${String(entries.length + 1).padStart(4, "0")}`;
}

function nextInvoiceNo(invoices) {
  const maxNumber = invoices.reduce((max, invoice) => {
    const match = invoice.invoiceNo?.match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `INV-2025-${String(maxNumber + 1).padStart(4, "0")}`;
}

function nextBillNo(bills) {
  const maxNumber = bills.reduce((max, bill) => {
    const match = bill.billNo?.match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `BILL-2025-${String(maxNumber + 1).padStart(4, "0")}`;
}

function invoiceSubtotal(invoice) {
  return invoice.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
}

function invoiceTotal(invoice) {
  return invoiceSubtotal(invoice) + (Number(invoice.taxAmount) || 0);
}

function billSubtotal(bill) {
  return bill.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    0,
  );
}

function billTotal(bill) {
  return billSubtotal(bill) + (Number(bill.taxAmount) || 0);
}

function StatusPill({ tone = "neutral", children }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function roleLabel(role) {
  if (!role) return "Member";
  return role[0].toUpperCase() + role.slice(1);
}

function canManageTeam(role) {
  return ["owner", "admin"].includes(role);
}

function canManageAccounting(role) {
  return ["owner", "admin", "accountant"].includes(role);
}

function LoginGate({ authEmail, authPassword, authStatus, setAuthEmail, setAuthPassword, onSignIn, onSignUp }) {
  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="login-mark">
            <Landmark size={34} />
          </div>
          <h1>Lao Accounting</h1>
          <p>Sign in to open the accounting workspace.</p>
        </div>
        <form className="login-form" onSubmit={onSignIn}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder="Password"
              minLength={6}
              required
            />
          </label>
          <button className="primary-button wide" type="submit">
            Sign in
          </button>
          <button className="secondary-button wide" type="button" onClick={onSignUp}>
            Create account
          </button>
        </form>
        {authStatus && <p className="auth-message">{authStatus}</p>}
      </section>
    </main>
  );
}

function OnboardingPage({
  companyNameDraft,
  setCompanyNameDraft,
  invitations,
  status,
  isSaving,
  onCreateCompany,
  onAcceptInvitation,
  onSignOut,
}) {
  return (
    <main className="login-page">
      <section className="login-panel onboarding-panel">
        <div className="login-brand">
          <div className="login-mark">
            <Building2 size={32} />
          </div>
          <div>
            <h1>Set up workspace</h1>
            <p>Create a company or accept an invitation.</p>
          </div>
        </div>

        <div className="login-form">
          <label>
            Company name
            <input value={companyNameDraft} onChange={(event) => setCompanyNameDraft(event.target.value)} placeholder="Rabbitwork Company" />
          </label>
          <button className="primary-button wide" onClick={onCreateCompany} disabled={isSaving || !companyNameDraft.trim()}>
            Create company
          </button>
        </div>

        <div className="onboarding-divider">Pending invitations</div>
        <div className="summary-list">
          {invitations.length ? (
            invitations.map((invitation) => (
              <div className="summary-row" key={invitation.id}>
                <span>{invitation.companyName || invitation.companyId}</span>
                <strong>{roleLabel(invitation.role)}</strong>
                <button className="secondary-button" onClick={() => onAcceptInvitation(invitation)} disabled={isSaving}>
                  Accept
                </button>
              </div>
            ))
          ) : (
            <p className="empty-state">No pending invitations for this email.</p>
          )}
        </div>

        {status && <p className="auth-message">{status}</p>}
        <button className="text-button" onClick={onSignOut}>Sign out</button>
      </section>
    </main>
  );
}

function DashboardPage({ totals, reviewEntries, recentEntries, reports, setActivePage }) {
  const kpis = [
    { label: "Assets", value: totals.assets, tone: "teal", icon: WalletCards },
    { label: "Liabilities", value: totals.liabilities, tone: "amber", icon: Landmark },
    { label: "Equity", value: totals.equity, tone: "indigo", icon: Building2 },
    { label: "Profit", value: totals.profit, tone: "green", icon: BarChart3 },
  ];

  return (
    <div className="page-grid dashboard-grid">
      <section className="kpi-strip">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <article className="metric" key={item.label}>
              <Icon className={item.tone} size={22} />
              <span>{item.label}</span>
              <strong>{compactMoney(item.value)}</strong>
            </article>
          );
        })}
      </section>

      <section className="panel trial-summary">
        <div className="panel-head">
          <div>
            <h2>Trial Balance Status</h2>
            <p>May 2025</p>
          </div>
          <StatusPill tone={totals.difference < 0.005 ? "success" : "warning"}>
            {totals.difference < 0.005 ? "Balanced" : "Needs review"}
          </StatusPill>
        </div>
        <dl className="summary-list">
          <div>
            <dt>Total Debits</dt>
            <dd>{money(totals.debits)}</dd>
          </div>
          <div>
            <dt>Total Credits</dt>
            <dd>{money(totals.credits)}</dd>
          </div>
          <div>
            <dt>Net Difference</dt>
            <dd>{money(totals.difference)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel review-panel">
        <div className="panel-head">
          <div>
            <h2>Review queue</h2>
            <p>{reviewEntries.length} entries need attention</p>
          </div>
          <button className="primary-button" onClick={() => setActivePage("journal")}>
            <Plus size={17} />
            Post entry
          </button>
        </div>
        <DataTable
          columns={["Entry No.", "Date", "Description", "Status", "Amount"]}
          rows={reviewEntries.slice(0, 5).map((entry) => {
            const totalsForEntry = entryTotals(entry);
            return [
              entry.id,
              entry.date,
              entry.description || "Missing description",
              <StatusPill tone="warning" key="status">Pending review</StatusPill>,
              money(Math.max(totalsForEntry.debit, totalsForEntry.credit)),
            ];
          })}
          empty="No review items"
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Recent journal entries</h2>
            <p>Latest activity from Supabase</p>
          </div>
          <button className="text-button" onClick={() => setActivePage("journal")}>
            View all <ArrowRight size={15} />
          </button>
        </div>
        <DataTable
          columns={["Entry No.", "Date", "Description", "Status"]}
          rows={recentEntries.slice(0, 5).map((entry) => [
            entry.id,
            entry.date,
            entry.description || "Missing description",
            <StatusPill tone={entry.status === "posted" ? "success" : "warning"} key="status">
              {entry.status}
            </StatusPill>,
          ])}
          empty="No journal entries"
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Reports</h2>
            <p>Generated from ledger rows</p>
          </div>
          <button className="text-button" onClick={() => setActivePage("reports")}>
            View all <ArrowRight size={15} />
          </button>
        </div>
        <DataTable
          columns={["Report", "Period", "Status"]}
          rows={reports.map((report) => [
            report.name,
            report.period,
            <StatusPill tone={report.status === "Ready" ? "success" : "neutral"} key={report.name}>
              {report.status}
            </StatusPill>,
          ])}
        />
      </section>
    </div>
  );
}

function JournalPage({
  accounts,
  accountsByCode,
  entries,
  draft,
  setDraft,
  draftAnalysis,
  saveDraft,
  postDraft,
  isSaving,
  canEdit,
  editingEntryId,
  cancelEdit,
  startEditEntry,
  voidEntry,
}) {
  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-grid journal-grid">
      <section className="panel journal-form-panel">
        <div className="panel-head">
          <div>
            <h2>{editingEntryId ? "Edit entry" : "Post entry"}</h2>
            <p>{canEdit ? "Signed-in changes are saved to Supabase." : "Your role has read-only journal access."}</p>
          </div>
          <StatusPill tone={draftAnalysis.canPost ? "success" : "warning"}>
            {draftAnalysis.canPost ? "Ready" : "Needs review"}
          </StatusPill>
        </div>
        <div className="entry-form">
          <label>
            Date
            <input value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} type="date" disabled={!canEdit} />
          </label>
          <label>
            Reference
            <input value={draft.reference} onChange={(event) => updateDraft("reference", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Description
            <input value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Debit account
            <select value={draft.debitAccount} onChange={(event) => updateDraft("debitAccount", event.target.value)} disabled={!canEdit}>
              {accounts.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} {account.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label>
            Debit amount
            <input type="number" value={draft.debit} min="0" onChange={(event) => updateDraft("debit", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Credit account
            <select value={draft.creditAccount} onChange={(event) => updateDraft("creditAccount", event.target.value)} disabled={!canEdit}>
              {accounts.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} {account.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label>
            Credit amount
            <input type="number" value={draft.credit} min="0" onChange={(event) => updateDraft("credit", event.target.value)} disabled={!canEdit} />
          </label>
        </div>
        <div className={draftAnalysis.canPost ? "validation success" : "validation warning"}>
          {draftAnalysis.canPost ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>
            Debit {money(draftAnalysis.debit)} - Credit {money(draftAnalysis.credit)} - Difference {money(draftAnalysis.difference)}
          </span>
        </div>
        <div className="form-actions">
          {editingEntryId && (
            <button className="secondary-button" onClick={cancelEdit} disabled={isSaving}>
              Cancel edit
            </button>
          )}
          <button className="secondary-button" onClick={saveDraft} disabled={!canEdit || isSaving}>
            Save for review
          </button>
          <button className="primary-button" onClick={postDraft} disabled={!canEdit || !draftAnalysis.canPost || isSaving}>
            {isSaving ? "Saving" : "Post entry"}
          </button>
        </div>
      </section>

      <section className="panel journal-table-panel">
        <div className="panel-head">
          <div>
            <h2>Journal register</h2>
            <p>{entries.length} entries</p>
          </div>
        </div>
        <DataTable
          columns={["Entry No.", "Date", "Description", "Debit", "Credit", "Status", "Actions"]}
          rows={entries.map((entry) => {
            const totals = analyzeEntry(entry, accountsByCode);
            return [
              entry.id,
              entry.date,
              entry.description || "Missing description",
              money(totals.debit),
              money(totals.credit),
              <StatusPill tone={entry.status === "posted" ? "success" : "warning"} key={entry.id}>
                {entry.status}
              </StatusPill>,
              <span className="table-actions" key={`${entry.id}-actions`}>
                <button className="text-button icon-button" onClick={() => startEditEntry(entry)} disabled={!canEdit || entry.status === "void"} title="Edit entry">
                  <Pencil size={15} />
                </button>
                <button className="text-button icon-button danger" onClick={() => voidEntry(entry)} disabled={!canEdit || entry.status === "void"} title="Void entry">
                  <XCircle size={15} />
                </button>
              </span>,
            ];
          })}
        />
      </section>
    </div>
  );
}

function SalesPage({
  customers,
  invoices,
  customerDraft,
  setCustomerDraft,
  invoiceDraft,
  setInvoiceDraft,
  salesStatus,
  saveCustomerDraft,
  saveInvoiceDraft,
  postInvoiceDraft,
  canEdit,
  isSaving,
}) {
  function updateCustomer(field, value) {
    setCustomerDraft((current) => ({ ...current, [field]: value }));
  }

  function updateInvoice(field, value) {
    setInvoiceDraft((current) => ({ ...current, [field]: value }));
  }

  function updateInvoiceItem(index, field, value) {
    setInvoiceDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addInvoiceLine() {
    setInvoiceDraft((current) => ({
      ...current,
      items: [...current.items, { description: "", quantity: 1, unitPrice: 0 }],
    }));
  }

  function removeInvoiceLine(index) {
    setInvoiceDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function invoiceStatusTone(status) {
    if (status === "sent" || status === "paid") return "success";
    if (status === "draft") return "warning";
    return "neutral";
  }

  const subtotal = invoiceSubtotal(invoiceDraft);
  const total = invoiceTotal(invoiceDraft);

  return (
    <div className="page-grid sales-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Add customer</h2>
            <p>{canEdit ? "Create billing profiles for sales invoices." : "Your role has read-only sales access."}</p>
          </div>
        </div>
        <div className="entry-form">
          <label className="span-2">
            Customer name
            <input value={customerDraft.name} onChange={(event) => updateCustomer("name", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Email
            <input type="email" value={customerDraft.email} onChange={(event) => updateCustomer("email", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Phone
            <input value={customerDraft.phone} onChange={(event) => updateCustomer("phone", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Billing address
            <textarea value={customerDraft.billingAddress} onChange={(event) => updateCustomer("billingAddress", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Status
            <select value={customerDraft.status} onChange={(event) => updateCustomer("status", event.target.value)} disabled={!canEdit}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" onClick={saveCustomerDraft} disabled={!canEdit || isSaving}>
            Save customer
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Draft invoice</h2>
            <p>Posting creates accounts receivable and revenue journal lines.</p>
          </div>
          <StatusPill tone={subtotal > 0 ? "success" : "warning"}>{money(total)}</StatusPill>
        </div>
        <div className="entry-form">
          <label>
            Invoice number
            <input value={invoiceDraft.invoiceNo} onChange={(event) => updateInvoice("invoiceNo", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Customer
            <select value={invoiceDraft.customerId} onChange={(event) => updateInvoice("customerId", event.target.value)} disabled={!canEdit || !customers.length}>
              <option value="">Select customer</option>
              {customers
                .filter((customer) => customer.status === "active")
                .map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
            </select>
          </label>
          <label>
            Issue date
            <input type="date" value={invoiceDraft.issueDate} onChange={(event) => updateInvoice("issueDate", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Due date
            <input type="date" value={invoiceDraft.dueDate} onChange={(event) => updateInvoice("dueDate", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Tax amount
            <input type="number" min="0" value={invoiceDraft.taxAmount} onChange={(event) => updateInvoice("taxAmount", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Notes
            <textarea value={invoiceDraft.notes} onChange={(event) => updateInvoice("notes", event.target.value)} disabled={!canEdit} />
          </label>
        </div>

        <div className="line-items">
          {invoiceDraft.items.map((item, index) => (
            <div className="invoice-line-grid" key={index}>
              <label>
                Description
                <input value={item.description} onChange={(event) => updateInvoiceItem(index, "description", event.target.value)} disabled={!canEdit} />
              </label>
              <label>
                Quantity
                <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateInvoiceItem(index, "quantity", event.target.value)} disabled={!canEdit} />
              </label>
              <label>
                Unit price
                <input type="number" min="0" value={item.unitPrice} onChange={(event) => updateInvoiceItem(index, "unitPrice", event.target.value)} disabled={!canEdit} />
              </label>
              <div className="line-total">
                <span>Line total</span>
                <strong>{money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</strong>
              </div>
              <button className="text-button icon-button danger" onClick={() => removeInvoiceLine(index)} disabled={!canEdit || invoiceDraft.items.length === 1} title="Remove line">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="sales-totals">
          <span>Subtotal {money(subtotal)}</span>
          <strong>Total {money(total)}</strong>
        </div>

        {salesStatus && <p className="notice">{salesStatus}</p>}
        <div className="form-actions">
          <button className="secondary-button" onClick={addInvoiceLine} disabled={!canEdit || isSaving}>
            <Plus size={17} />
            Add line
          </button>
          <button className="primary-button" onClick={saveInvoiceDraft} disabled={!canEdit || isSaving || !customers.length}>
            Save invoice
          </button>
        </div>
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>Sales invoices</h2>
            <p>{invoices.length} invoices from Supabase</p>
          </div>
        </div>
        <DataTable
          columns={["Invoice", "Customer", "Total", "Status", "Actions", "Issue", "Due", "Ledger"]}
          rows={invoices.map((invoice) => [
            invoice.invoiceNo,
            invoice.customerName || "Unknown customer",
            money(invoice.totalAmount),
            <StatusPill tone={invoiceStatusTone(invoice.status)} key={`${invoice.id}-status`}>{invoice.status}</StatusPill>,
            <span className="table-actions" key={`${invoice.id}-actions`}>
              <button className="text-button" onClick={() => postInvoiceDraft(invoice)} disabled={!canEdit || isSaving || invoice.status !== "draft"}>
                Post
              </button>
            </span>,
            invoice.issueDate,
            invoice.dueDate,
            invoice.postedEntryNo || "Not posted",
          ])}
          empty="No sales invoices"
        />
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>Customers</h2>
            <p>{customers.length} billing profiles</p>
          </div>
        </div>
        <DataTable
          columns={["Name", "Email", "Phone", "Status"]}
          rows={customers.map((customer) => [
            customer.name,
            customer.email || "No email",
            customer.phone || "No phone",
            <StatusPill tone={customer.status === "active" ? "success" : "neutral"} key={customer.id}>{customer.status}</StatusPill>,
          ])}
          empty="No customers"
        />
      </section>
    </div>
  );
}

function PurchasesPage({
  accounts,
  vendors,
  bills,
  vendorDraft,
  setVendorDraft,
  billDraft,
  setBillDraft,
  purchaseStatus,
  saveVendorDraft,
  saveBillDraft,
  postBillDraft,
  canEdit,
  isSaving,
}) {
  const purchaseAccounts = accounts.filter((account) => ["Expense", "Asset"].includes(account.type));

  function updateVendor(field, value) {
    setVendorDraft((current) => ({ ...current, [field]: value }));
  }

  function updateBill(field, value) {
    setBillDraft((current) => ({ ...current, [field]: value }));
  }

  function updateBillItem(index, field, value) {
    setBillDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addBillLine() {
    setBillDraft((current) => ({
      ...current,
      items: [...current.items, { accountCode: purchaseAccounts[0]?.code ?? "6200", description: "", quantity: 1, unitCost: 0 }],
    }));
  }

  function removeBillLine(index) {
    setBillDraft((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function billStatusTone(status) {
    if (status === "approved" || status === "paid") return "success";
    if (status === "draft") return "warning";
    return "neutral";
  }

  const subtotal = billSubtotal(billDraft);
  const total = billTotal(billDraft);

  return (
    <div className="page-grid sales-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Add vendor</h2>
            <p>{canEdit ? "Create supplier profiles for purchase bills." : "Your role has read-only purchase access."}</p>
          </div>
        </div>
        <div className="entry-form">
          <label className="span-2">
            Vendor name
            <input value={vendorDraft.name} onChange={(event) => updateVendor("name", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Email
            <input type="email" value={vendorDraft.email} onChange={(event) => updateVendor("email", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Phone
            <input value={vendorDraft.phone} onChange={(event) => updateVendor("phone", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Tax ID
            <input value={vendorDraft.taxId} onChange={(event) => updateVendor("taxId", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Billing address
            <textarea value={vendorDraft.billingAddress} onChange={(event) => updateVendor("billingAddress", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Status
            <select value={vendorDraft.status} onChange={(event) => updateVendor("status", event.target.value)} disabled={!canEdit}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" onClick={saveVendorDraft} disabled={!canEdit || isSaving}>
            Save vendor
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Draft bill</h2>
            <p>Posting creates expense, input tax, and accounts payable lines.</p>
          </div>
          <StatusPill tone={subtotal > 0 ? "success" : "warning"}>{money(total)}</StatusPill>
        </div>
        <div className="entry-form">
          <label>
            Bill number
            <input value={billDraft.billNo} onChange={(event) => updateBill("billNo", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Vendor
            <select value={billDraft.vendorId} onChange={(event) => updateBill("vendorId", event.target.value)} disabled={!canEdit || !vendors.length}>
              <option value="">Select vendor</option>
              {vendors
                .filter((vendor) => vendor.status === "active")
                .map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
            </select>
          </label>
          <label>
            Bill date
            <input type="date" value={billDraft.billDate} onChange={(event) => updateBill("billDate", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Due date
            <input type="date" value={billDraft.dueDate} onChange={(event) => updateBill("dueDate", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Tax amount
            <input type="number" min="0" value={billDraft.taxAmount} onChange={(event) => updateBill("taxAmount", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            Notes
            <textarea value={billDraft.notes} onChange={(event) => updateBill("notes", event.target.value)} disabled={!canEdit} />
          </label>
        </div>

        <div className="line-items">
          {billDraft.items.map((item, index) => (
            <div className="invoice-line-grid purchase-line-grid" key={index}>
              <label>
                Account
                <select value={item.accountCode} onChange={(event) => updateBillItem(index, "accountCode", event.target.value)} disabled={!canEdit}>
                  {purchaseAccounts.map((account) => (
                    <option key={account.code} value={account.code}>{account.code} {account.nameEn}</option>
                  ))}
                </select>
              </label>
              <label>
                Description
                <input value={item.description} onChange={(event) => updateBillItem(index, "description", event.target.value)} disabled={!canEdit} />
              </label>
              <label>
                Quantity
                <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateBillItem(index, "quantity", event.target.value)} disabled={!canEdit} />
              </label>
              <label>
                Unit cost
                <input type="number" min="0" value={item.unitCost} onChange={(event) => updateBillItem(index, "unitCost", event.target.value)} disabled={!canEdit} />
              </label>
              <div className="line-total">
                <span>Line total</span>
                <strong>{money((Number(item.quantity) || 0) * (Number(item.unitCost) || 0))}</strong>
              </div>
              <button className="text-button icon-button danger" onClick={() => removeBillLine(index)} disabled={!canEdit || billDraft.items.length === 1} title="Remove line">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="sales-totals">
          <span>Subtotal {money(subtotal)}</span>
          <strong>Total {money(total)}</strong>
        </div>

        {purchaseStatus && <p className="notice">{purchaseStatus}</p>}
        <div className="form-actions">
          <button className="secondary-button" onClick={addBillLine} disabled={!canEdit || isSaving}>
            <Plus size={17} />
            Add line
          </button>
          <button className="primary-button" onClick={saveBillDraft} disabled={!canEdit || isSaving || !vendors.length || !purchaseAccounts.length}>
            Save bill
          </button>
        </div>
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>Purchase bills</h2>
            <p>{bills.length} bills from Supabase</p>
          </div>
        </div>
        <DataTable
          columns={["Bill", "Vendor", "Total", "Status", "Actions", "Bill date", "Due", "Ledger"]}
          rows={bills.map((bill) => [
            bill.billNo,
            bill.vendorName || "Unknown vendor",
            money(bill.totalAmount),
            <StatusPill tone={billStatusTone(bill.status)} key={`${bill.id}-status`}>{bill.status}</StatusPill>,
            <span className="table-actions" key={`${bill.id}-actions`}>
              <button className="text-button" onClick={() => postBillDraft(bill)} disabled={!canEdit || isSaving || bill.status !== "draft"}>
                Post
              </button>
            </span>,
            bill.billDate,
            bill.dueDate,
            bill.postedEntryNo || "Not posted",
          ])}
          empty="No purchase bills"
        />
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>Vendors</h2>
            <p>{vendors.length} supplier profiles</p>
          </div>
        </div>
        <DataTable
          columns={["Name", "Email", "Phone", "Status"]}
          rows={vendors.map((vendor) => [
            vendor.name,
            vendor.email || "No email",
            vendor.phone || "No phone",
            <StatusPill tone={vendor.status === "active" ? "success" : "neutral"} key={vendor.id}>{vendor.status}</StatusPill>,
          ])}
          empty="No vendors"
        />
      </section>
    </div>
  );
}

function AccountsPage({
  accountRows,
  accountDraft,
  setAccountDraft,
  editingAccountCode,
  startEditAccount,
  cancelAccountEdit,
  saveAccountDraft,
  deleteAccountRow,
  accountStatus,
  canEdit,
  isSaving,
}) {
  function updateAccount(field, value) {
    setAccountDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-grid management-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{editingAccountCode ? "Edit account" : "Add account"}</h2>
            <p>{canEdit ? "Maintain the company chart of accounts." : "Your role has read-only account access."}</p>
          </div>
        </div>
        <div className="entry-form">
          <label>
            Code
            <input value={accountDraft.code} onChange={(event) => updateAccount("code", event.target.value)} disabled={!canEdit || !!editingAccountCode} />
          </label>
          <label>
            Name
            <input value={accountDraft.nameEn} onChange={(event) => updateAccount("nameEn", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Type
            <select value={accountDraft.type} onChange={(event) => updateAccount("type", event.target.value)} disabled={!canEdit}>
              {accountTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            Normal side
            <select value={accountDraft.normalSide} onChange={(event) => updateAccount("normalSide", event.target.value)} disabled={!canEdit}>
              {normalSides.map((side) => (
                <option key={side} value={side}>{side}</option>
              ))}
            </select>
          </label>
          <label>
            Opening debit
            <input type="number" min="0" value={accountDraft.openingDebit} onChange={(event) => updateAccount("openingDebit", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            Opening credit
            <input type="number" min="0" value={accountDraft.openingCredit} onChange={(event) => updateAccount("openingCredit", event.target.value)} disabled={!canEdit} />
          </label>
        </div>
        {accountStatus && <p className="notice">{accountStatus}</p>}
        <div className="form-actions">
          {editingAccountCode && (
            <button className="secondary-button" onClick={cancelAccountEdit} disabled={isSaving}>
              Cancel edit
            </button>
          )}
          <button className="primary-button" onClick={saveAccountDraft} disabled={!canEdit || isSaving}>
            Save account
          </button>
        </div>
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>Chart of Accounts</h2>
            <p>{accountRows.length} accounts from Supabase</p>
          </div>
        </div>
        <DataTable
          columns={["Code", "Account", "Type", "Normal side", "Debit", "Credit", "Balance", "Actions"]}
          rows={accountRows.map((account) => [
            account.code,
            account.nameEn,
            account.type,
            account.normalSide,
            money(account.netDebit),
            money(account.netCredit),
            money(account.balance),
            <span className="table-actions" key={`${account.code}-actions`}>
              <button className="text-button icon-button" onClick={() => startEditAccount(account)} disabled={!canEdit} title="Edit account">
                <Pencil size={15} />
              </button>
              <button className="text-button icon-button danger" onClick={() => deleteAccountRow(account)} disabled={!canEdit} title="Delete account">
                <Trash2 size={15} />
              </button>
            </span>,
          ])}
        />
      </section>
    </div>
  );
}

function TrialPage({ trialRows, totals }) {
  return (
    <section className="panel full-page-panel">
      <div className="panel-head">
        <div>
          <h2>Trial Balance</h2>
          <p>Debits and credits recalculated from posted entries</p>
        </div>
        <StatusPill tone={totals.difference < 0.005 ? "success" : "warning"}>
          Difference {money(totals.difference)}
        </StatusPill>
      </div>
      <DataTable
        columns={["Group", "Debit", "Credit"]}
        rows={trialRows.map((row) => [row.label, money(row.debit), money(row.credit)])}
      />
    </section>
  );
}

function ReportsPage({ reports, totals }) {
  return (
    <div className="page-grid reports-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Reports</h2>
            <p>Ready reports use current Supabase ledger rows.</p>
          </div>
        </div>
        <DataTable
          columns={["Report", "Period", "Status", "Value"]}
          rows={reports.map((report) => [
            report.name,
            report.period,
            <StatusPill tone={report.status === "Ready" ? "success" : "neutral"} key={report.name}>
              {report.status}
            </StatusPill>,
            report.value,
          ])}
        />
      </section>
      <section className="panel report-notes">
        <h2>Close readiness</h2>
        <dl className="summary-list">
          <div>
            <dt>Total debits</dt>
            <dd>{money(totals.debits)}</dd>
          </div>
          <div>
            <dt>Total credits</dt>
            <dd>{money(totals.credits)}</dd>
          </div>
          <div>
            <dt>Net profit</dt>
            <dd>{money(totals.profit)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function TeamPage({
  company,
  teamMembers,
  invitations,
  inviteDraft,
  setInviteDraft,
  teamStatus,
  canEdit,
  isSaving,
  addMember,
  changeMemberRole,
  removeMember,
}) {
  function updateInvite(field, value) {
    setInviteDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-grid management-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Add team member</h2>
            <p>{canEdit ? "Create a pending invitation for a teammate." : "Only owners and admins can manage team members."}</p>
          </div>
          <StatusPill tone={canEdit ? "success" : "neutral"}>{canEdit ? "Admin access" : "Read only"}</StatusPill>
        </div>
        <div className="entry-form">
          <label className="span-2">
            Email
            <input
              type="email"
              value={inviteDraft.email}
              onChange={(event) => updateInvite("email", event.target.value)}
              disabled={!canEdit}
              placeholder="teammate@company.com"
            />
          </label>
          <label className="span-2">
            Role
            <select value={inviteDraft.role} onChange={(event) => updateInvite("role", event.target.value)} disabled={!canEdit}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{roleLabel(role)}</option>
              ))}
            </select>
          </label>
        </div>
        {teamStatus && <p className="notice">{teamStatus}</p>}
        <div className="form-actions">
          <button className="primary-button" onClick={addMember} disabled={!canEdit || isSaving}>
            <UserPlus size={17} />
            Create invitation
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Pending invitations</h2>
            <p>{invitations.length} open invites</p>
          </div>
        </div>
        <DataTable
          columns={["Email", "Role", "Status"]}
          rows={invitations.map((invitation) => [
            invitation.email,
            roleLabel(invitation.role),
            <StatusPill tone="neutral" key={invitation.id}>{invitation.status}</StatusPill>,
          ])}
          empty="No pending invitations"
        />
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>{company?.name ?? "Company"} team</h2>
            <p>{teamMembers.length} members</p>
          </div>
        </div>
        <DataTable
          columns={["Name", "Email", "Role", "Actions"]}
          rows={teamMembers.map((member) => [
            member.displayName || member.email,
            member.email,
            <select
              className="role-select"
              value={member.role}
              onChange={(event) => changeMemberRole(member, event.target.value)}
              disabled={!canEdit || isSaving}
              key={`${member.id}-role`}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>{roleLabel(role)}</option>
              ))}
            </select>,
            <span className="table-actions" key={`${member.id}-actions`}>
              <button className="text-button icon-button danger" onClick={() => removeMember(member)} disabled={!canEdit || isSaving} title="Remove member">
                <Trash2 size={15} />
              </button>
            </span>,
          ])}
          empty="No team members"
        />
      </section>
    </div>
  );
}

function AuditPage({ auditEvents, teamMembers }) {
  const membersById = new Map(teamMembers.map((member) => [member.userId, member]));

  return (
    <section className="panel full-page-panel">
      <div className="panel-head">
        <div>
          <h2>Audit history</h2>
          <p>Latest company changes captured by database triggers.</p>
        </div>
      </div>
      <DataTable
        columns={["Time", "Actor", "Action", "Entity", "Record"]}
        rows={auditEvents.map((event) => {
          const actor = membersById.get(event.actorUserId);
          return [
            new Date(event.createdAt).toLocaleString(),
            actor?.email ?? "System",
            event.action,
            event.entityType,
            event.entityId,
          ];
        })}
        empty="No audit events yet"
      />
    </section>
  );
}

function SettingsPage({ settings, setSettings, session, company, memberRole }) {
  function updateSetting(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-grid settings-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Appearance</h2>
            <p>Preferences stay on this browser.</p>
          </div>
        </div>
        <div className="settings-list">
          <label className="setting-row">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(event) => updateSetting("darkMode", event.target.checked)}
            />
            <span>
              <strong>Dark mode</strong>
              <small>Use a darker workspace palette.</small>
            </span>
          </label>
          <label className="setting-row">
            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={(event) => updateSetting("compactMode", event.target.checked)}
            />
            <span>
              <strong>Compact layout</strong>
              <small>Reduce padding for denser tables and panels.</small>
            </span>
          </label>
          <label className="setting-row">
            <input
              type="checkbox"
              checked={settings.largeText}
              onChange={(event) => updateSetting("largeText", event.target.checked)}
            />
            <span>
              <strong>Larger text</strong>
              <small>Increase app text size for readability.</small>
            </span>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Workspace</h2>
            <p>Current signed-in context.</p>
          </div>
        </div>
        <dl className="summary-list">
          <div>
            <dt>Company</dt>
            <dd>{company?.name ?? "No company"}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{roleLabel(memberRole)}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{session.user.email}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function DataTable({ columns, rows = [], empty = "No data" }) {
  return (
    <div className="data-table">
      <div className="data-table-head" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.length ? (
        rows.map((row, rowIndex) => (
          <div className="data-table-row" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }} key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <span key={cellIndex}>{cell}</span>
            ))}
          </div>
        ))
      ) : (
        <div className="empty-state">{empty}</div>
      )}
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
  const [accounts, setAccounts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState(blankDraft);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [accountDraft, setAccountDraft] = useState(blankAccount);
  const [editingAccountCode, setEditingAccountCode] = useState(null);
  const [accountStatus, setAccountStatus] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [availableInvitations, setAvailableInvitations] = useState([]);
  const [customerDraft, setCustomerDraft] = useState(blankCustomer);
  const [invoiceDraft, setInvoiceDraft] = useState(() => blankInvoice());
  const [salesStatus, setSalesStatus] = useState("");
  const [vendorDraft, setVendorDraft] = useState(blankVendor);
  const [billDraft, setBillDraft] = useState(() => blankPurchaseBill());
  const [purchaseStatus, setPurchaseStatus] = useState("");
  const [inviteDraft, setInviteDraft] = useState(blankMemberInvite);
  const [teamStatus, setTeamStatus] = useState("");
  const [companyNameDraft, setCompanyNameDraft] = useState("Rabbitwork Company");
  const [onboardingStatus, setOnboardingStatus] = useState("");
  const [company, setCompany] = useState(null);
  const [memberRole, setMemberRole] = useState(null);
  const [dataStatus, setDataStatus] = useState("idle");
  const [dataError, setDataError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [userSettings, setUserSettings] = useState(loadStoredUserSettings);

  const accountsByCode = useMemo(() => new Map(accounts.map((account) => [account.code, account])), [accounts]);
  const accountRows = useMemo(() => buildAccountRows(accounts, entries), [accounts, entries]);
  const trialRows = useMemo(() => buildTrialRows(accountRows), [accountRows]);
  const reviewEntries = useMemo(() => entries.filter((entry) => entry.status !== "posted"), [entries]);
  const recentEntries = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date)), [entries]);
  const userCanManageTeam = canManageTeam(memberRole);
  const userCanManageAccounting = canManageAccounting(memberRole);
  const draftAnalysis = useMemo(
    () => analyzeEntry(draftToEntry(draft, "DRAFT", "review", company?.id), accountsByCode),
    [draft, accountsByCode, company?.id],
  );

  const totals = useMemo(() => {
    const category = accountRows.reduce(
      (sum, account) => {
        const value = Math.max(account.balance, 0);
        if (account.type === "Asset") sum.assets += value;
        if (account.type === "Liability") sum.liabilities += value;
        if (account.type === "Equity") sum.equity += value;
        if (account.type === "Revenue") sum.revenue += value;
        if (account.type === "Expense") sum.expenses += value;
        return sum;
      },
      { assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0 },
    );
    const debits = trialRows.reduce((sum, row) => sum + row.debit, 0);
    const credits = trialRows.reduce((sum, row) => sum + row.credit, 0);
    return {
      ...category,
      profit: category.revenue - category.expenses,
      debits,
      credits,
      difference: Math.abs(debits - credits),
    };
  }, [accountRows, trialRows]);

  const reports = [
    { name: "Profit & Loss", period: "May 2025", status: "Ready", value: money(totals.profit) },
    { name: "Balance Sheet", period: "May 2025", status: "Ready", value: money(totals.assets) },
    { name: "Trial Balance", period: "May 2025", status: totals.difference < 0.005 ? "Ready" : "Draft", value: money(totals.difference) },
    { name: "Cash Flow Statement", period: "May 2025", status: "Draft", value: "Pending close" },
  ];

  function applyWorkspace(workspace) {
    const nextCustomers = workspace.customers ?? [];
    const nextInvoices = workspace.invoices ?? [];
    const nextVendors = workspace.vendors ?? [];
    const nextPurchaseBills = workspace.purchaseBills ?? [];
    const nextAccounts = workspace.accounts ?? [];

    setCompany(workspace.company ?? null);
    setMemberRole(workspace.role ?? null);
    setTeamMembers(workspace.teamMembers ?? []);
    setInvitations(workspace.invitations ?? []);
    setAuditEvents(workspace.auditEvents ?? []);
    setCustomers(nextCustomers);
    setInvoices(nextInvoices);
    setVendors(nextVendors);
    setPurchaseBills(nextPurchaseBills);
    setAvailableInvitations(workspace.availableInvitations ?? []);
    setAccounts(nextAccounts);
    setEntries(workspace.entries ?? []);
    setInvoiceDraft((current) => {
      const firstCustomerId = nextCustomers.find((customer) => customer.status === "active")?.id ?? "";
      if (current.invoiceNo === nextInvoiceNo([]) && !current.customerId) return blankInvoice(nextCustomers, nextInvoices);
      return { ...current, customerId: current.customerId || firstCustomerId };
    });
    setBillDraft((current) => {
      const firstVendorId = nextVendors.find((vendor) => vendor.status === "active")?.id ?? "";
      const firstAccountCode = nextAccounts.find((account) => account.type === "Expense")?.code ?? "6200";
      if (current.billNo === nextBillNo([]) && !current.vendorId) {
        return blankPurchaseBill(nextVendors, nextPurchaseBills, nextAccounts);
      }
      return {
        ...current,
        vendorId: current.vendorId || firstVendorId,
        items: current.items.map((item) => ({ ...item, accountCode: item.accountCode || firstAccountCode })),
      };
    });
    setDataStatus("supabase");
  }

  useEffect(() => {
    document.documentElement.dataset.theme = userSettings.darkMode ? "dark" : "light";
    document.documentElement.dataset.density = userSettings.compactMode ? "compact" : "comfortable";
    document.documentElement.dataset.textSize = userSettings.largeText ? "large" : "normal";
    window.localStorage.setItem("accounting-user-settings", JSON.stringify(userSettings));
  }, [userSettings]);

  useEffect(() => {
    let mounted = true;
    async function initAuth() {
      try {
        const currentSession = await getCurrentSession();
        if (mounted) setSession(currentSession);
      } catch (error) {
        if (mounted) setAuthStatus(error?.message ?? "Could not load session.");
      }
    }
    initAuth();
    const unsubscribe = onAuthChange((nextSession) => setSession(nextSession));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let mounted = true;
    async function loadWorkspace() {
      setDataStatus("loading");
      setDataError("");
      try {
        const workspace = await loadAccountingWorkspace();
        if (!mounted) return;
        applyWorkspace(workspace);
      } catch (error) {
        if (!mounted) return;
        setDataStatus("error");
        setDataError(error?.message ?? "Could not load Supabase data.");
      }
    }
    loadWorkspace();
    return () => {
      mounted = false;
    };
  }, [session]);

  async function handleSignIn(event) {
    event.preventDefault();
    setAuthStatus("");
    try {
      await signInWithEmail(authEmail, authPassword);
      setAuthPassword("");
    } catch (error) {
      setAuthStatus(error?.message ?? "Could not sign in.");
    }
  }

  async function handleSignUp() {
    setAuthStatus("");
    try {
      const nextSession = await signUpWithEmail(authEmail, authPassword);
      setAuthPassword("");
      setAuthStatus(nextSession ? "Account created." : "Check your email to confirm your account.");
    } catch (error) {
      setAuthStatus(error?.message ?? "Could not create account.");
    }
  }

  async function handleSignOut() {
    await signOut();
    setSession(null);
    setAccounts([]);
    setEntries([]);
    setTeamMembers([]);
    setInvitations([]);
    setAuditEvents([]);
    setCustomers([]);
    setInvoices([]);
    setVendors([]);
    setPurchaseBills([]);
    setAvailableInvitations([]);
    setCompany(null);
    setMemberRole(null);
    setOnboardingStatus("");
    setEditingEntryId(null);
    setAccountDraft(blankAccount);
    setEditingAccountCode(null);
    setCustomerDraft(blankCustomer);
    setInvoiceDraft(blankInvoice());
    setSalesStatus("");
    setVendorDraft(blankVendor);
    setBillDraft(blankPurchaseBill());
    setPurchaseStatus("");
    setInviteDraft(blankMemberInvite);
    setActivePage("dashboard");
  }

  async function commitDraft(status) {
    if (!company?.id) {
      setDataStatus("error");
      setDataError("Your account is not connected to a company workspace yet.");
      return;
    }

    const entry = draftToEntry(draft, editingEntryId || nextJournalId(entries), status, company.id);
    setIsSaving(true);
    try {
      await saveJournalEntry(entry);
      setEntries((current) => {
        const withoutEntry = current.filter((item) => item.id !== entry.id);
        return [entry, ...withoutEntry];
      });
      setDraft(blankDraft);
      setEditingEntryId(null);
    } finally {
      setIsSaving(false);
    }
  }

  function startEditEntry(entry) {
    const debitLine = entry.lines.find((line) => line.side === "debit") ?? entry.lines[0];
    const creditLine = entry.lines.find((line) => line.side === "credit") ?? entry.lines[1] ?? entry.lines[0];

    setEditingEntryId(entry.id);
    setDraft({
      date: entry.date,
      description: entry.description,
      reference: entry.reference,
      debitAccount: debitLine?.account ?? accounts[0]?.code ?? "",
      creditAccount: creditLine?.account ?? accounts[1]?.code ?? accounts[0]?.code ?? "",
      debit: debitLine?.amount ?? 0,
      credit: creditLine?.amount ?? 0,
    });
    setActivePage("journal");
  }

  function cancelEntryEdit() {
    setEditingEntryId(null);
    setDraft(blankDraft);
  }

  async function handleVoidEntry(entry) {
    setIsSaving(true);
    try {
      await voidJournalEntry(entry);
      setEntries((current) => current.map((item) => (item.id === entry.id ? { ...item, status: "void" } : item)));
      if (editingEntryId === entry.id) cancelEntryEdit();
    } catch (error) {
      setDataStatus("error");
      setDataError(error?.message ?? "Could not void journal entry.");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditAccount(account) {
    setEditingAccountCode(account.code);
    setAccountDraft({
      code: account.code,
      nameEn: account.nameEn,
      nameLao: account.nameLao ?? "",
      type: account.type,
      normalSide: account.normalSide,
      openingDebit: account.openingDebit,
      openingCredit: account.openingCredit,
    });
    setAccountStatus("");
  }

  function cancelAccountEdit() {
    setEditingAccountCode(null);
    setAccountDraft(blankAccount);
    setAccountStatus("");
  }

  async function handleSaveAccountDraft() {
    if (!company?.id) return;
    if (!accountDraft.code.trim() || !accountDraft.nameEn.trim()) {
      setAccountStatus("Account code and name are required.");
      return;
    }

    const nextAccount = {
      ...accountDraft,
      companyId: company.id,
      code: accountDraft.code.trim(),
      nameEn: accountDraft.nameEn.trim(),
    };

    setIsSaving(true);
    setAccountStatus("");
    try {
      await saveAccount(nextAccount);
      setAccounts((current) => {
        const withoutAccount = current.filter((account) => account.code !== nextAccount.code);
        return [...withoutAccount, nextAccount].sort((a, b) => a.code.localeCompare(b.code));
      });
      setEditingAccountCode(null);
      setAccountDraft(blankAccount);
      setAccountStatus("Account saved.");
    } catch (error) {
      setAccountStatus(error?.message ?? "Could not save account.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccountRow(account) {
    if (!company?.id) return;
    setIsSaving(true);
    setAccountStatus("");
    try {
      await deleteAccount(company.id, account.code);
      setAccounts((current) => current.filter((item) => item.code !== account.code));
      setAccountStatus("Account deleted.");
      if (editingAccountCode === account.code) cancelAccountEdit();
    } catch (error) {
      setAccountStatus(error?.message ?? "Could not delete account. Accounts used by journal lines are protected.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveCustomerDraft() {
    if (!company?.id) return;
    if (!customerDraft.name.trim()) {
      setSalesStatus("Customer name is required.");
      return;
    }

    const nextCustomer = {
      ...customerDraft,
      companyId: company.id,
      name: customerDraft.name.trim(),
      email: customerDraft.email.trim(),
      phone: customerDraft.phone.trim(),
      billingAddress: customerDraft.billingAddress.trim(),
    };

    setIsSaving(true);
    setSalesStatus("");
    try {
      const savedCustomer = await saveCustomer(nextCustomer);
      const nextCustomers = [
        savedCustomer,
        ...customers.filter((customer) => customer.id !== savedCustomer.id),
      ].sort((a, b) => a.name.localeCompare(b.name));
      setCustomers(nextCustomers);
      setCustomerDraft(blankCustomer);
      setInvoiceDraft((current) => ({ ...current, customerId: current.customerId || savedCustomer.id }));
      setSalesStatus("Customer saved.");
    } catch (error) {
      setSalesStatus(error?.message ?? "Could not save customer.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveInvoiceDraft() {
    if (!company?.id) return;
    const trimmedItems = invoiceDraft.items.map((item) => ({
      description: item.description.trim(),
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
    }));

    if (!invoiceDraft.invoiceNo.trim() || !invoiceDraft.customerId) {
      setSalesStatus("Invoice number and customer are required.");
      return;
    }

    if (!invoiceDraft.issueDate || !invoiceDraft.dueDate || invoiceDraft.dueDate < invoiceDraft.issueDate) {
      setSalesStatus("Invoice dates are invalid.");
      return;
    }

    if (!trimmedItems.length || trimmedItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setSalesStatus("Every invoice line needs a description, positive quantity, and non-negative unit price.");
      return;
    }

    const nextInvoice = {
      ...invoiceDraft,
      companyId: company.id,
      invoiceNo: invoiceDraft.invoiceNo.trim(),
      items: trimmedItems,
      taxAmount: Number(invoiceDraft.taxAmount) || 0,
    };

    if (invoiceSubtotal(nextInvoice) <= 0) {
      setSalesStatus("Invoice subtotal must be greater than zero.");
      return;
    }

    setIsSaving(true);
    setSalesStatus("");
    try {
      const savedInvoice = await saveInvoice(nextInvoice);
      const nextInvoices = [
        savedInvoice,
        ...invoices.filter((invoice) => invoice.id !== savedInvoice.id),
      ].sort((a, b) => b.issueDate.localeCompare(a.issueDate));
      setInvoices(nextInvoices);
      setInvoiceDraft(blankInvoice(customers, nextInvoices));
      setSalesStatus("Invoice saved as draft.");
    } catch (error) {
      setSalesStatus(error?.message ?? "Could not save invoice.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePostInvoiceDraft(invoice) {
    setIsSaving(true);
    setSalesStatus("");
    try {
      const postedEntryNo = await postInvoice(invoice.id);
      const workspace = await loadAccountingWorkspace();
      applyWorkspace(workspace);
      setSalesStatus(`Invoice posted to ${postedEntryNo}.`);
    } catch (error) {
      setSalesStatus(error?.message ?? "Could not post invoice.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveVendorDraft() {
    if (!company?.id) return;
    if (!vendorDraft.name.trim()) {
      setPurchaseStatus("Vendor name is required.");
      return;
    }

    const nextVendor = {
      ...vendorDraft,
      companyId: company.id,
      name: vendorDraft.name.trim(),
      email: vendorDraft.email.trim(),
      phone: vendorDraft.phone.trim(),
      taxId: vendorDraft.taxId.trim(),
      billingAddress: vendorDraft.billingAddress.trim(),
    };

    setIsSaving(true);
    setPurchaseStatus("");
    try {
      const savedVendor = await saveVendor(nextVendor);
      const nextVendors = [
        savedVendor,
        ...vendors.filter((vendor) => vendor.id !== savedVendor.id),
      ].sort((a, b) => a.name.localeCompare(b.name));
      setVendors(nextVendors);
      setVendorDraft(blankVendor);
      setBillDraft((current) => ({ ...current, vendorId: current.vendorId || savedVendor.id }));
      setPurchaseStatus("Vendor saved.");
    } catch (error) {
      setPurchaseStatus(error?.message ?? "Could not save vendor.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSavePurchaseBillDraft() {
    if (!company?.id) return;
    const trimmedItems = billDraft.items.map((item) => ({
      accountCode: item.accountCode,
      description: item.description.trim(),
      quantity: Number(item.quantity) || 0,
      unitCost: Number(item.unitCost) || 0,
    }));

    if (!billDraft.billNo.trim() || !billDraft.vendorId) {
      setPurchaseStatus("Bill number and vendor are required.");
      return;
    }

    if (!billDraft.billDate || !billDraft.dueDate || billDraft.dueDate < billDraft.billDate) {
      setPurchaseStatus("Bill dates are invalid.");
      return;
    }

    if (!trimmedItems.length || trimmedItems.some((item) => !item.accountCode || !item.description || item.quantity <= 0 || item.unitCost < 0)) {
      setPurchaseStatus("Every bill line needs an account, description, positive quantity, and non-negative unit cost.");
      return;
    }

    const nextBill = {
      ...billDraft,
      companyId: company.id,
      billNo: billDraft.billNo.trim(),
      items: trimmedItems,
      taxAmount: Number(billDraft.taxAmount) || 0,
    };

    if (billSubtotal(nextBill) <= 0) {
      setPurchaseStatus("Bill subtotal must be greater than zero.");
      return;
    }

    setIsSaving(true);
    setPurchaseStatus("");
    try {
      const savedBill = await savePurchaseBill(nextBill);
      const nextBills = [
        savedBill,
        ...purchaseBills.filter((bill) => bill.id !== savedBill.id),
      ].sort((a, b) => b.billDate.localeCompare(a.billDate));
      setPurchaseBills(nextBills);
      setBillDraft(blankPurchaseBill(vendors, nextBills, accounts));
      setPurchaseStatus("Bill saved as draft.");
    } catch (error) {
      setPurchaseStatus(error?.message ?? "Could not save bill.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePostPurchaseBillDraft(bill) {
    setIsSaving(true);
    setPurchaseStatus("");
    try {
      const postedEntryNo = await postPurchaseBill(bill.id);
      const workspace = await loadAccountingWorkspace();
      applyWorkspace(workspace);
      setPurchaseStatus(`Bill posted to ${postedEntryNo}.`);
    } catch (error) {
      setPurchaseStatus(error?.message ?? "Could not post bill.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddMember() {
    if (!company?.id) return;
    if (!inviteDraft.email.trim()) {
      setTeamStatus("Email is required.");
      return;
    }

    setIsSaving(true);
    setTeamStatus("");
    try {
      const invitation = await createCompanyInvitation(company.id, inviteDraft.email.trim(), inviteDraft.role);
      if (invitation) {
        setInvitations((current) => {
          const withoutInvitation = current.filter((item) => item.id !== invitation.id && item.email.toLowerCase() !== invitation.email.toLowerCase());
          return [invitation, ...withoutInvitation];
        });
      }
      setInviteDraft(blankMemberInvite);
      setTeamStatus("Invitation saved.");
    } catch (error) {
      setTeamStatus(error?.message ?? "Could not add team member.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateCompany() {
    setIsSaving(true);
    setOnboardingStatus("");
    try {
      await createCompanyForCurrentUser(companyNameDraft.trim());
      const workspace = await loadAccountingWorkspace();
      applyWorkspace(workspace);
      setOnboardingStatus("Company created.");
    } catch (error) {
      setOnboardingStatus(error?.message ?? "Could not create company.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAcceptInvitation(invitation) {
    setIsSaving(true);
    setOnboardingStatus("");
    try {
      await acceptCompanyInvitation(invitation);
      const workspace = await loadAccountingWorkspace();
      applyWorkspace(workspace);
      setOnboardingStatus("Invitation accepted.");
    } catch (error) {
      setOnboardingStatus(error?.message ?? "Could not accept invitation.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangeMemberRole(member, role) {
    setIsSaving(true);
    setTeamStatus("");
    try {
      const updatedMember = await updateCompanyMemberRole(member.id, role);
      if (updatedMember) {
        setTeamMembers((current) => current.map((item) => (item.id === member.id ? { ...item, role: updatedMember.role } : item)));
      }
      if (member.userId === session.user.id) setMemberRole(role);
      setTeamStatus("Role updated.");
    } catch (error) {
      setTeamStatus(error?.message ?? "Could not update role.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveMember(member) {
    setIsSaving(true);
    setTeamStatus("");
    try {
      await removeCompanyMember(member.id);
      setTeamMembers((current) => current.filter((item) => item.id !== member.id));
      setTeamStatus("Team member removed.");
    } catch (error) {
      setTeamStatus(error?.message ?? "Could not remove team member.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!session) {
    return (
      <LoginGate
        authEmail={authEmail}
        authPassword={authPassword}
        authStatus={authStatus}
        setAuthEmail={setAuthEmail}
        setAuthPassword={setAuthPassword}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    );
  }

  if (!company && (dataStatus === "idle" || dataStatus === "loading")) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <div className="loading-panel">
            <RefreshCcw size={22} />
            Loading workspace data
          </div>
        </section>
      </main>
    );
  }

  if (!company) {
    return (
      <OnboardingPage
        companyNameDraft={companyNameDraft}
        setCompanyNameDraft={setCompanyNameDraft}
        invitations={availableInvitations}
        status={dataError || onboardingStatus}
        isSaving={isSaving}
        onCreateCompany={handleCreateCompany}
        onAcceptInvitation={handleAcceptInvitation}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Landmark size={25} />
          <strong>Lao Accounting</strong>
        </div>
        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => setActivePage(item.id)}>
                <Icon size={19} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">AC</div>
          <div>
            <strong>{memberRole ? memberRole[0].toUpperCase() + memberRole.slice(1) : "Member"}</strong>
            <span>{session.user.email}</span>
          </div>
        </div>
      </aside>

      <section className="main-workspace">
        <header className="topbar">
          <div>
            <p>May 2025 - {company?.name ?? "No company assigned"}</p>
            <h1>{pageTitles[activePage]}</h1>
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" onClick={handleSignOut}>
              <LogOut size={17} />
              Sign out
            </button>
          </div>
        </header>

        {dataError && <div className="notice warning">{dataError}</div>}
        {dataStatus === "loading" ? (
          <div className="loading-panel">
            <RefreshCcw size={22} />
            Loading workspace data
          </div>
        ) : (
          <>
            {activePage === "dashboard" && (
              <DashboardPage
                totals={totals}
                reviewEntries={reviewEntries}
                recentEntries={recentEntries}
                reports={reports}
                setActivePage={setActivePage}
              />
            )}
            {activePage === "journal" && (
              <JournalPage
                accounts={accounts}
                accountsByCode={accountsByCode}
                entries={entries}
                draft={draft}
                setDraft={setDraft}
                draftAnalysis={draftAnalysis}
                saveDraft={() => commitDraft("review")}
                postDraft={() => commitDraft("posted")}
                isSaving={isSaving}
                canEdit={userCanManageAccounting}
                editingEntryId={editingEntryId}
                cancelEdit={cancelEntryEdit}
                startEditEntry={startEditEntry}
                voidEntry={handleVoidEntry}
              />
            )}
            {activePage === "sales" && (
              <SalesPage
                customers={customers}
                invoices={invoices}
                customerDraft={customerDraft}
                setCustomerDraft={setCustomerDraft}
                invoiceDraft={invoiceDraft}
                setInvoiceDraft={setInvoiceDraft}
                salesStatus={salesStatus}
                saveCustomerDraft={handleSaveCustomerDraft}
                saveInvoiceDraft={handleSaveInvoiceDraft}
                postInvoiceDraft={handlePostInvoiceDraft}
                canEdit={userCanManageAccounting}
                isSaving={isSaving}
              />
            )}
            {activePage === "purchases" && (
              <PurchasesPage
                accounts={accounts}
                vendors={vendors}
                bills={purchaseBills}
                vendorDraft={vendorDraft}
                setVendorDraft={setVendorDraft}
                billDraft={billDraft}
                setBillDraft={setBillDraft}
                purchaseStatus={purchaseStatus}
                saveVendorDraft={handleSaveVendorDraft}
                saveBillDraft={handleSavePurchaseBillDraft}
                postBillDraft={handlePostPurchaseBillDraft}
                canEdit={userCanManageAccounting}
                isSaving={isSaving}
              />
            )}
            {activePage === "accounts" && (
              <AccountsPage
                accountRows={accountRows}
                accountDraft={accountDraft}
                setAccountDraft={setAccountDraft}
                editingAccountCode={editingAccountCode}
                startEditAccount={startEditAccount}
                cancelAccountEdit={cancelAccountEdit}
                saveAccountDraft={handleSaveAccountDraft}
                deleteAccountRow={handleDeleteAccountRow}
                accountStatus={accountStatus}
                canEdit={userCanManageAccounting}
                isSaving={isSaving}
              />
            )}
            {activePage === "trial" && <TrialPage trialRows={trialRows} totals={totals} />}
            {activePage === "reports" && <ReportsPage reports={reports} totals={totals} />}
            {activePage === "team" && (
              <TeamPage
                company={company}
                teamMembers={teamMembers}
                invitations={invitations}
                inviteDraft={inviteDraft}
                setInviteDraft={setInviteDraft}
                teamStatus={teamStatus}
                canEdit={userCanManageTeam}
                isSaving={isSaving}
                addMember={handleAddMember}
                changeMemberRole={handleChangeMemberRole}
                removeMember={handleRemoveMember}
              />
            )}
            {activePage === "audit" && <AuditPage auditEvents={auditEvents} teamMembers={teamMembers} />}
            {activePage === "settings" && (
              <SettingsPage
                settings={userSettings}
                setSettings={setUserSettings}
                session={session}
                company={company}
                memberRole={memberRole}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
