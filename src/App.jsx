import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Landmark,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCcw,
  Scale,
  Table2,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  createCompanyInvitation,
  deleteAccount,
  getCurrentSession,
  loadAccountingWorkspace,
  onAuthChange,
  removeCompanyMember,
  saveAccount,
  saveJournalEntry,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateCompanyMemberRole,
  voidJournalEntry,
} from "./lib/accountingData.js";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "journal", label: "Journal", icon: ReceiptText },
  { id: "accounts", label: "Chart of Accounts", icon: Table2 },
  { id: "trial", label: "Trial Balance", icon: Scale },
  { id: "reports", label: "Reports", icon: FileSpreadsheet },
  { id: "team", label: "Team", icon: Users },
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
  accounts: "Chart of Accounts",
  trial: "Trial Balance",
  reports: "Reports",
  team: "Team",
};

const roleOptions = ["owner", "admin", "accountant", "reviewer", "viewer"];
const accountTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
const normalSides = ["debit", "credit"];

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
  const [inviteDraft, setInviteDraft] = useState(blankMemberInvite);
  const [teamStatus, setTeamStatus] = useState("");
  const [company, setCompany] = useState(null);
  const [memberRole, setMemberRole] = useState(null);
  const [dataStatus, setDataStatus] = useState("idle");
  const [dataError, setDataError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
        setCompany(workspace.company ?? null);
        setMemberRole(workspace.role ?? null);
        setTeamMembers(workspace.teamMembers ?? []);
        setInvitations(workspace.invitations ?? []);
        setAccounts(workspace.accounts ?? []);
        setEntries(workspace.entries ?? []);
        setDataStatus("supabase");
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
    setCompany(null);
    setMemberRole(null);
    setEditingEntryId(null);
    setAccountDraft(blankAccount);
    setEditingAccountCode(null);
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
            <StatusPill tone={dataStatus === "error" ? "warning" : "success"}>
              {dataStatus === "loading" && "Loading Supabase"}
              {dataStatus === "supabase" && "Data source: Supabase"}
              {dataStatus === "error" && "Supabase error"}
              {dataStatus === "idle" && "Ready"}
            </StatusPill>
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
          </>
        )}
      </section>
    </main>
  );
}

export default App;
