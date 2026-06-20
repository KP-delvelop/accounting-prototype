import {
  AlertTriangle,
  Banknote,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Gauge,
  Globe2,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Lock,
  Menu,
  Presentation,
  ReceiptText,
  Scale,
  Search,
  Settings,
  Sparkles,
  Table2,
  UserRound,
  WalletCards,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { excelSeed } from "./data/excelSeed.js";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "journal", label: "Journal", icon: ReceiptText },
  { id: "accounts", label: "Chart of Accounts", icon: Table2 },
  { id: "trial", label: "Trial Balance", icon: Scale },
  { id: "reports", label: "Reports", icon: FileSpreadsheet },
];

const workflow = [
  { label: "Data Entry", value: "27 / 27", state: "done" },
  { label: "Validation", value: "2 issues", state: "warning" },
  { label: "Review", value: "In progress", state: "active" },
  { label: "Approved", value: "Waiting", state: "idle" },
  { label: "Posted", value: "Ready after review", state: "idle" },
];

const reportGroups = [
  {
    title: "Before Closing",
    items: [
      { label: "Bank reconciliation", status: "ready", meta: "May 2025" },
      { label: "AR aging summary", status: "ready", meta: "May 2025" },
      { label: "AP aging summary", status: "ready", meta: "May 2025" },
      { label: "Inventory valuation", status: "review", meta: "Needs review" },
      { label: "Journal entry review", status: "review", meta: "Needs review" },
    ],
  },
  {
    title: "After Closing",
    items: [
      { label: "Profit & loss statement", status: "locked", meta: "After close" },
      { label: "Balance sheet", status: "locked", meta: "After close" },
      { label: "Cash flow statement", status: "locked", meta: "After close" },
      { label: "Equity statement", status: "locked", meta: "After close" },
    ],
  },
];

const issueRows = [
  {
    date: "2025-05-18",
    no: "JV-2025-0518-003",
    description: "Office supplies purchase",
    account: "6200 Office Supplies",
    issue: "Missing description",
    amount: 1250000,
  },
  {
    date: "2025-05-22",
    no: "JV-2025-0522-007",
    description: "Customer receipt",
    account: "1120 Accounts Receivable",
    issue: "Unbalanced entry",
    amount: 5600000,
  },
];

const trialRows = [
  { type: "Assets", debit: 39075000, credit: 0, status: "Balanced" },
  { type: "Liabilities", debit: 0, credit: 12100000, status: "Balanced" },
  { type: "Equity", debit: 0, credit: 20000000, status: "Balanced" },
  { type: "Revenue", debit: 0, credit: 9800000, status: "Balanced" },
  { type: "Expenses", debit: 2825000, credit: 0, status: "Balanced" },
];

const extraAccounts = [
  { code: "2000", nameEn: "Accounts Payable", type: "Liability", balance: 7850000 },
  { code: "2100", nameEn: "Bank Loan", type: "Liability", balance: 4250000 },
  { code: "3000", nameEn: "Owner's Equity", type: "Equity", balance: 20000000 },
  { code: "7000", nameEn: "Service Revenue", type: "Revenue", balance: 9800000 },
  { code: "6200", nameEn: "Office Supplies", type: "Expense", balance: 1250000 },
  { code: "6400", nameEn: "Administrative Expense", type: "Expense", balance: 1575000 },
];

function formatKip(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

function formatCompactKip(value) {
  if (Math.abs(value) >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  return formatKip(value);
}

function StatusIcon({ status }) {
  if (status === "ready") return <CheckCircle2 size={16} className="icon-success" />;
  if (status === "review") return <AlertTriangle size={16} className="icon-warning" />;
  return <Lock size={16} className="icon-muted" />;
}

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [language, setLanguage] = useState("Lao");
  const [meetingMode, setMeetingMode] = useState(true);
  const [draft, setDraft] = useState({
    debitAccount: "6200 Office Supplies",
    creditAccount: "1011 Cash in LAK",
    debit: 1250000,
    credit: 1250000,
  });

  const accounts = useMemo(() => {
    const seedAccounts = excelSeed.accounts
      .filter((account) => account.nameEn && account.nameEn !== "Mapped account")
      .slice(0, 9)
      .map((account) => ({
        ...account,
        displayName: account.nameEn,
      }));
    return [...seedAccounts, ...extraAccounts.map((account) => ({ ...account, displayName: account.nameEn }))];
  }, []);

  const totalDebits = trialRows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredits = trialRows.reduce((sum, row) => sum + row.credit, 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const draftDifference = Math.abs(Number(draft.debit || 0) - Number(draft.credit || 0));

  const kpis = [
    {
      label: "Total Assets",
      value: 39075000,
      change: "+8.6%",
      icon: WalletCards,
      tone: "teal",
    },
    {
      label: "Liabilities",
      value: 12100000,
      change: "+5.3%",
      icon: Landmark,
      tone: "blue",
    },
    {
      label: "Equity",
      value: 20000000,
      change: "+4.8%",
      icon: Building2,
      tone: "green",
    },
    {
      label: "Net Profit MTD",
      value: 6975000,
      change: "-1.2%",
      icon: BarChart3,
      tone: "amber",
    },
  ];

  return (
    <main className={meetingMode ? "app meeting-mode" : "app"}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">
            <BookOpen size={24} />
          </div>
          <div>
            <strong>Lao Accounting</strong>
            <span>Workspace</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeView === item.id ? "nav-item active" : "nav-item"}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-section">
          <p>Workflow</p>
          <div className="side-status">
            <CheckCircle2 size={17} />
            <span>Trial balance ready</span>
          </div>
          <div className="side-status warning">
            <AlertTriangle size={17} />
            <span>2 entries need review</span>
          </div>
        </div>

        <button className="collapse-button">
          <Menu size={18} />
          <span>Compact Menu</span>
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="selectors">
            <button className="select-button">
              Sabaidee Trading Co., Ltd.
              <ChevronDown size={16} />
            </button>
            <button className="select-button">
              <CalendarDays size={17} />
              May 2025
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="top-actions">
            <div className="segmented" aria-label="Report language">
              {["Lao", "English"].map((item) => (
                <button
                  key={item}
                  className={language === item ? "selected" : ""}
                  onClick={() => setLanguage(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              className={meetingMode ? "icon-button active" : "icon-button"}
              onClick={() => setMeetingMode((value) => !value)}
              title="Meeting mode"
            >
              <Presentation size={18} />
            </button>
            <button className="icon-button" title="Settings">
              <Settings size={18} />
            </button>
            <div className="profile-chip">
              <span>AC</span>
              Accountant
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        <section className="hero-strip">
          <div>
            <p className="section-label">Demo workspace</p>
            <h1>May closing workspace</h1>
            <p>
              27 journal entries · 2 need review · Trial balance balanced · Reports ready in
              Lao and English
            </p>
          </div>
          <div className="hero-actions">
            <button className="primary-button">
              <ClipboardCheck size={18} />
              Review Entries
            </button>
            <button className="secondary-button">
              <Download size={18} />
              Export Demo
            </button>
          </div>
        </section>

        <section className="kpi-grid" aria-label="Financial summary">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <article className="kpi-panel" key={kpi.label}>
                <div className={`kpi-icon ${kpi.tone}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <span>{kpi.label}</span>
                  <strong>₭ {formatCompactKip(kpi.value)}</strong>
                  <small className={kpi.change.startsWith("-") ? "negative" : "positive"}>
                    {kpi.change} vs Apr 2025
                  </small>
                </div>
              </article>
            );
          })}
        </section>

        <div className="main-grid">
          <section className="content-stack">
            <section className="panel workflow-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-label">Guided workflow</p>
                  <h2>Journal Workflow</h2>
                </div>
                <button className="text-button">View all issues (2)</button>
              </div>

              <div className="steps">
                {workflow.map((step, index) => (
                  <div className="step" key={step.label}>
                    <div className={`step-number ${step.state}`}>
                      {step.state === "done" ? <Check size={17} /> : index + 1}
                    </div>
                    <div>
                      <strong>{step.label}</strong>
                      <span>{step.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="issue-list" aria-label="Journal issues">
                {issueRows.map((row) => (
                  <article className="issue-row" key={row.no}>
                    <div className="issue-date">
                      <strong>{row.date.slice(8)}</strong>
                      <span>{row.date.slice(0, 7)}</span>
                    </div>
                    <div className="issue-main">
                      <strong>{row.description}</strong>
                      <span>{row.no} · {row.account}</span>
                    </div>
                    <div className="issue-state">
                      <AlertTriangle size={16} />
                      <span>{row.issue}</span>
                    </div>
                    <div className="issue-amount">
                      <strong>₭ {formatKip(row.amount)}</strong>
                      <button className="mini-button">Review</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="split-row">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-label">Source: Excel workbook</p>
                    <h2>Chart of Accounts</h2>
                  </div>
                  <button className="text-button" onClick={() => setActiveView("accounts")}>
                    View all
                  </button>
                </div>
                <div className="account-list">
                  {accounts.slice(0, 7).map((account) => (
                    <div className="account-row" key={account.code}>
                      <span className="account-code">{account.code}</span>
                      <div>
                        <strong>{account.displayName}</strong>
                        <small>{account.type}</small>
                      </div>
                      <span className="amount">₭ {formatKip(account.balance)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-label">As of 31 May 2025</p>
                    <h2>Trial Balance</h2>
                  </div>
                  <span className="status-pill success">Balanced</span>
                </div>
                <div className="trial-list">
                  {trialRows.map((row) => (
                    <div className="trial-row" key={row.type}>
                      <div>
                        <strong>{row.type}</strong>
                        <span>Dr ₭ {formatKip(row.debit)} · Cr ₭ {formatKip(row.credit)}</span>
                      </div>
                      <em>{row.status}</em>
                    </div>
                  ))}
                  <div className="balance-result">
                    <CheckCircle2 size={24} />
                    <div>
                      <strong>Balanced</strong>
                      <span>Total debits equal total credits</span>
                    </div>
                    <b>₭ {formatKip(difference)}</b>
                  </div>
                </div>
              </section>
            </section>

            <section className="panel journal-builder">
              <div className="panel-heading">
                <div>
                  <p className="section-label">Live validation</p>
                  <h2>Quick Journal Entry</h2>
                </div>
                <span className={draftDifference === 0 ? "status-pill success" : "status-pill warning"}>
                  {draftDifference === 0 ? "Balanced" : "Needs Review"}
                </span>
              </div>

              <div className="entry-grid">
                <label>
                  Debit account
                  <input
                    value={draft.debitAccount}
                    onChange={(event) => setDraft({ ...draft, debitAccount: event.target.value })}
                  />
                </label>
                <label>
                  Debit amount
                  <input
                    type="number"
                    value={draft.debit}
                    onChange={(event) => setDraft({ ...draft, debit: event.target.value })}
                  />
                </label>
                <label>
                  Credit account
                  <input
                    value={draft.creditAccount}
                    onChange={(event) => setDraft({ ...draft, creditAccount: event.target.value })}
                  />
                </label>
                <label>
                  Credit amount
                  <input
                    type="number"
                    value={draft.credit}
                    onChange={(event) => setDraft({ ...draft, credit: event.target.value })}
                  />
                </label>
              </div>

              <div className={draftDifference === 0 ? "validation-box success" : "validation-box warning"}>
                {draftDifference === 0 ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                <div>
                  <strong>{draftDifference === 0 ? "Entry can be posted" : "Entry is not balanced"}</strong>
                  <span>
                    Difference: ₭ {formatKip(draftDifference)}. The app checks debit and credit totals before posting.
                  </span>
                </div>
              </div>
            </section>
          </section>

          <aside className="reports-rail">
            <div className="panel-heading">
              <div>
                <p className="section-label">Language: {language}</p>
                <h2>Reports</h2>
              </div>
              <button className="mini-button export">
                <Download size={16} />
                Export
              </button>
            </div>

            {reportGroups.map((group) => (
              <section className="report-group" key={group.title}>
                <h3>{group.title}</h3>
                {group.items.map((item, index) => (
                  <div className="report-item" key={item.label}>
                    <StatusIcon status={item.status} />
                    <span>{index + 1}. {item.label}</span>
                    <small>{item.meta}</small>
                  </div>
                ))}
              </section>
            ))}

            <div className="meeting-note">
              <Sparkles size={18} />
              <div>
                <strong>Meeting demo path</strong>
                <span>Show data entry, validation, trial balance, then report export.</span>
              </div>
            </div>
          </aside>
        </div>

        <footer className="footer-line">
          <span>Workbook source: {excelSeed.sourceFile}</span>
          <span>All amounts in LAK (₭)</span>
        </footer>
      </section>
    </main>
  );
}

export default App;
