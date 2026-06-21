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
  Plus,
  ReceiptText,
  RefreshCcw,
  Scale,
  Table2,
  WalletCards,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import {
  getCurrentSession,
  loadAccountingWorkspace,
  onAuthChange,
  saveJournalEntry,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from "./lib/accountingData.js";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "journal", label: "Journal", icon: ReceiptText },
  { id: "accounts", label: "Chart of Accounts", icon: Table2 },
  { id: "trial", label: "Trial Balance", icon: Scale },
  { id: "reports", label: "Reports", icon: FileSpreadsheet },
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

function JournalPage({ accounts, accountsByCode, entries, draft, setDraft, draftAnalysis, saveDraft, postDraft, isSaving }) {
  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-grid journal-grid">
      <section className="panel journal-form-panel">
        <div className="panel-head">
          <div>
            <h2>Post entry</h2>
            <p>Signed-in changes are saved to Supabase.</p>
          </div>
          <StatusPill tone={draftAnalysis.canPost ? "success" : "warning"}>
            {draftAnalysis.canPost ? "Ready" : "Needs review"}
          </StatusPill>
        </div>
        <div className="entry-form">
          <label>
            Date
            <input value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} type="date" />
          </label>
          <label>
            Reference
            <input value={draft.reference} onChange={(event) => updateDraft("reference", event.target.value)} />
          </label>
          <label className="span-2">
            Description
            <input value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} />
          </label>
          <label>
            Debit account
            <select value={draft.debitAccount} onChange={(event) => updateDraft("debitAccount", event.target.value)}>
              {accounts.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} {account.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label>
            Debit amount
            <input type="number" value={draft.debit} min="0" onChange={(event) => updateDraft("debit", event.target.value)} />
          </label>
          <label>
            Credit account
            <select value={draft.creditAccount} onChange={(event) => updateDraft("creditAccount", event.target.value)}>
              {accounts.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} {account.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label>
            Credit amount
            <input type="number" value={draft.credit} min="0" onChange={(event) => updateDraft("credit", event.target.value)} />
          </label>
        </div>
        <div className={draftAnalysis.canPost ? "validation success" : "validation warning"}>
          {draftAnalysis.canPost ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>
            Debit {money(draftAnalysis.debit)} · Credit {money(draftAnalysis.credit)} · Difference {money(draftAnalysis.difference)}
          </span>
        </div>
        <div className="form-actions">
          <button className="secondary-button" onClick={saveDraft} disabled={isSaving}>
            Save for review
          </button>
          <button className="primary-button" onClick={postDraft} disabled={!draftAnalysis.canPost || isSaving}>
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
          columns={["Entry No.", "Date", "Description", "Debit", "Credit", "Status"]}
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
            ];
          })}
        />
      </section>
    </div>
  );
}

function AccountsPage({ accountRows }) {
  return (
    <section className="panel full-page-panel">
      <div className="panel-head">
        <div>
          <h2>Chart of Accounts</h2>
          <p>{accountRows.length} accounts from Supabase</p>
        </div>
      </div>
      <DataTable
        columns={["Code", "Account", "Type", "Normal side", "Debit", "Credit", "Balance"]}
        rows={accountRows.map((account) => [
          account.code,
          account.nameEn,
          account.type,
          account.normalSide,
          money(account.netDebit),
          money(account.netCredit),
          money(account.balance),
        ])}
      />
    </section>
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
    setCompany(null);
    setMemberRole(null);
    setActivePage("dashboard");
  }

  async function commitDraft(status) {
    if (!company?.id) {
      setDataStatus("error");
      setDataError("Your account is not connected to a company workspace yet.");
      return;
    }

    const entry = draftToEntry(draft, nextJournalId(entries), status, company.id);
    setIsSaving(true);
    try {
      await saveJournalEntry(entry);
      setEntries((current) => [entry, ...current]);
      setDraft(blankDraft);
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
              />
            )}
            {activePage === "accounts" && <AccountsPage accountRows={accountRows} />}
            {activePage === "trial" && <TrialPage trialRows={trialRows} totals={totals} />}
            {activePage === "reports" && <ReportsPage reports={reports} totals={totals} />}
          </>
        )}
      </section>
    </main>
  );
}

export default App;
