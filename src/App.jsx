import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Landmark,
  LayoutDashboard,
  Lock,
  Menu,
  Moon,
  PlusCircle,
  Presentation,
  ReceiptText,
  RefreshCcw,
  Save,
  Scale,
  Settings,
  Sparkles,
  Sun,
  Table2,
  WalletCards,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { excelSeed } from "./data/excelSeed.js";
import {
  getCurrentSession,
  loadAccountingWorkspace,
  onAuthChange,
  saveJournalEntry,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from "./lib/accountingData.js";

const STORAGE_KEY = "accounting-prototype-ledger-v2";
const THEME_STORAGE_KEY = "accounting-prototype-theme-v1";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "journal", label: "Journal", icon: ReceiptText },
  { id: "accounts", label: "Chart of Accounts", icon: Table2 },
  { id: "trial", label: "Trial Balance", icon: Scale },
  { id: "reports", label: "Reports", icon: FileSpreadsheet },
];

const viewCopy = {
  dashboard: {
    label: "Live workspace",
    title: "May closing workspace",
  },
  journal: {
    label: "Journal operations",
    title: "Post, review, and correct entries",
  },
  accounts: {
    label: "Account master",
    title: "Chart of accounts with live balances",
  },
  trial: {
    label: "Ledger control",
    title: "Trial balance recalculated from posted entries",
  },
  reports: {
    label: "Reporting center",
    title: "Financial reports generated from the ledger",
  },
};

const languageOptions = [
  { value: "Lao", label: "ລາວ" },
  { value: "English", label: "English" },
];

const laoAccountNames = {
  1011: "ເງິນສົດເປັນກີບ",
  1012: "ເງິນສົດເປັນເງິນຕ່າງປະເທດ",
  1013: "ເງິນສົດຍ່ອຍ",
  1014: "ເງິນສົດກຳລັງນຳຝາກ",
  1017: "ເງິນສົດລ່ວງໜ້າ",
  1021: "ເງິນຝາກທະນາຄານເປັນກີບ",
  1022: "ເງິນຝາກທະນາຄານເປັນເງິນຕ່າງປະເທດ",
  2000: "ໜີ້ຕ້ອງຈ່າຍ",
  2100: "ເງິນກູ້ທະນາຄານ",
  3000: "ທຶນເຈົ້າຂອງ",
  7000: "ລາຍຮັບຄ່າບໍລິການ",
  6200: "ເຄື່ອງໃຊ້ສຳນັກງານ",
  6400: "ຄ່າໃຊ້ຈ່າຍບໍລິຫານ",
};

const laoJournalDescriptions = {
  "Bank loan received": "ໄດ້ຮັບເງິນກູ້ຈາກທະນາຄານ",
  "Customer payment for monthly service": "ຮັບເງິນລູກຄ້າສຳລັບຄ່າບໍລິການລາຍເດືອນ",
  "Administrative expenses paid": "ຈ່າຍຄ່າໃຊ້ຈ່າຍບໍລິຫານ",
  "Customer receipt entered from bank statement": "ບັນທຶກເງິນຮັບຈາກລູກຄ້າຕາມໃບແຈ້ງທະນາຄານ",
  "Office supplies purchase": "ຊື້ເຄື່ອງໃຊ້ສຳນັກງານ",
};

const translations = {
  English: {
    appName: "Lao Accounting",
    workspace: "Workspace",
    company: "Sabaidee Trading Co., Ltd.",
    period: "May 2025",
    accountant: "Accountant",
    workflowLabel: "Workflow",
    meetingMode: "Meeting mode",
    resetDemoData: "Reset demo data",
    settings: "Settings",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    reportLanguage: "Report language",
    compactMenu: "Compact Menu",
    sideTrialReady: "Trial balance ready",
    sideTrialOff: "Trial balance off",
    sideNoIssues: "No review issues",
    sideNeedReview: "entries need review",
    reviewEntries: "Review Entries",
    exportData: "Export Data",
    afterPosting: "after posting",
    guidedWorkflow: "Guided workflow",
    journalWorkflow: "Journal Workflow",
    viewAllIssues: "View all issues",
    allPosted: "All journal entries are posted and validated.",
    missingDescription: "Missing description",
    waitingReview: "Waiting review",
    review: "Review",
    sourceWorkbook: "Source: Excel workbook",
    chartOfAccounts: "Chart of Accounts",
    searchAccounts: "Search accounts",
    accountType: "Account type",
    allTypes: "All types",
    accountsShown: "accounts shown",
    viewAll: "View all",
    asOf: "As of 31 May 2025",
    trialBalance: "Trial Balance",
    balanced: "Balanced",
    needsReview: "Needs Review",
    live: "Live",
    clear: "Clear",
    debitShort: "Dr",
    creditShort: "Cr",
    differenceFound: "Difference found",
    totalDebits: "Total debits",
    equal: "equal",
    doNotEqual: "do not equal",
    totalCredits: "total credits",
    liveValidation: "Live validation",
    editing: "Editing",
    quickJournalEntry: "Quick Journal Entry",
    readyToPost: "Ready to Post",
    date: "Date",
    reference: "Reference",
    description: "Description",
    debitAccount: "Debit account",
    debitAmount: "Debit amount",
    creditAccount: "Credit account",
    creditAmount: "Credit amount",
    entryCanBePosted: "Entry can be posted",
    debit: "Debit",
    credit: "Credit",
    difference: "Difference",
    clearButton: "Clear",
    saveForReview: "Save for Review",
    updateAndPost: "Update & Post",
    postEntry: "Post Entry",
    savedLocally: "Saved locally",
    journalRegister: "Journal Register",
    posted: "Posted",
    languageLabel: "Language",
    reportsTitle: "Reports",
    export: "Export",
    reportProfit: "Profit",
    openReviewBeforeClosing: "Open review before closing",
    readyForClosing: "Ready for closing",
    beforeClosing: "Before Closing",
    afterClosing: "After Closing",
    meetingDemoPath: "Meeting demo path",
    meetingDemoText: "Post an entry, fix a review item, then show the trial balance changing live.",
    workbookSource: "Workbook source",
    autosave: "Local changes auto-save in this browser",
    nav: {
      dashboard: "Dashboard",
      journal: "Journal",
      accounts: "Chart of Accounts",
      trial: "Trial Balance",
      reports: "Reports",
    },
    viewCopy,
    workflow: {
      dataEntry: "Data Entry",
      validation: "Validation",
      review: "Review",
      approved: "Approved",
      posted: "Posted",
    },
    workflowValues: {
      issues: "issues",
      entries: "entries",
      inProgress: "In progress",
      clear: "Clear",
      posted: "posted",
      ledgerBalanced: "Ledger balanced",
      checkLedger: "Check ledger",
    },
    heroSummary: ({ entries, reviewRows, balanced }) =>
      `${entries} journal entries - ${reviewRows} need review - Trial balance ${
        balanced ? "balanced" : "needs checking"
      } - Reports update from posted ledger data.`,
    issueMap: {
      "Missing description": "Missing description",
      "Unbalanced entry": "Unbalanced entry",
      "Missing amount": "Missing amount",
    },
    unknownAccount: "Unknown account",
    typeLabels: {
      Asset: "Asset",
      Liability: "Liability",
      Equity: "Equity",
      Revenue: "Revenue",
      Expense: "Expense",
      Assets: "Assets",
      Liabilities: "Liabilities",
      Expenses: "Expenses",
    },
    reportItems: {
      bankReconciliation: "Bank reconciliation",
      arAging: "AR aging summary",
      apAging: "AP aging summary",
      inventoryValuation: "Inventory valuation",
      journalReview: "Journal entry review",
      profitLoss: "Profit & loss statement",
      balanceSheet: "Balance sheet",
      cashFlow: "Cash flow statement",
      equityStatement: "Equity statement",
    },
    reportMeta: {
      ready: "Ready",
      needsReview: "Needs review",
      open: "open",
      autoGenerated: "Auto generated",
      afterReview: "After review",
      may2025: "May 2025",
    },
    kpi: {
      assets: "Total Assets",
      liabilities: "Liabilities",
      equity: "Equity",
      profit: "Net Profit MTD",
      liveChange: "+ live",
      negativeLiveChange: "- live",
    },
  },
  Lao: {
    appName: "ບັນຊີລາວ",
    workspace: "ພື້ນທີ່ເຮັດວຽກ",
    company: "ບໍລິສັດ ສະບາຍດີ ເທຣດດິ້ງ ຈຳກັດ",
    period: "ພຶດສະພາ 2025",
    accountant: "ນັກບັນຊີ",
    workflowLabel: "ຂັ້ນຕອນ",
    meetingMode: "ໂໝດປະຊຸມ",
    resetDemoData: "ຣີເຊັດຂໍ້ມູນຕົວຢ່າງ",
    settings: "ຕັ້ງຄ່າ",
    darkMode: "ໂໝດມືດ",
    lightMode: "ໂໝດສະຫວ່າງ",
    reportLanguage: "ພາສາລາຍງານ",
    compactMenu: "ເມນູຫຍໍ້",
    sideTrialReady: "ງົບທົດລອງພ້ອມ",
    sideTrialOff: "ງົບທົດລອງບໍ່ສົມດຸນ",
    sideNoIssues: "ບໍ່ມີລາຍການຕ້ອງກວດ",
    sideNeedReview: "ລາຍການຕ້ອງກວດ",
    reviewEntries: "ກວດລາຍການ",
    exportData: "ສົ່ງອອກຂໍ້ມູນ",
    afterPosting: "ຫຼັງຈາກບັນທຶກ",
    guidedWorkflow: "ຂັ້ນຕອນແນະນຳ",
    journalWorkflow: "ຂັ້ນຕອນສົມຸດລາຍວັນ",
    viewAllIssues: "ເບິ່ງບັນຫາທັງໝົດ",
    allPosted: "ລາຍການທັງໝົດຖືກບັນທຶກ ແລະ ກວດສອບແລ້ວ",
    missingDescription: "ຂາດຄຳອະທິບາຍ",
    waitingReview: "ລໍຖ້າກວດ",
    review: "ກວດ",
    sourceWorkbook: "ແຫຼ່ງຂໍ້ມູນ: Excel workbook",
    chartOfAccounts: "ຜັງບັນຊີ",
    searchAccounts: "ຄົ້ນຫາບັນຊີ",
    accountType: "ປະເພດບັນຊີ",
    allTypes: "ທຸກປະເພດ",
    accountsShown: "ບັນຊີທີ່ສະແດງ",
    viewAll: "ເບິ່ງທັງໝົດ",
    asOf: "ວັນທີ 31 ພຶດສະພາ 2025",
    trialBalance: "ງົບທົດລອງ",
    balanced: "ສົມດຸນ",
    needsReview: "ຕ້ອງກວດ",
    live: "ສົດ",
    clear: "ປົກກະຕິ",
    debitShort: "Dr",
    creditShort: "Cr",
    differenceFound: "ພົບຜົນຕ່າງ",
    totalDebits: "ຍອດເດບິດ",
    equal: "ເທົ່າກັບ",
    doNotEqual: "ບໍ່ເທົ່າກັບ",
    totalCredits: "ຍອດເຄຣດິດ",
    liveValidation: "ກວດສອບສົດ",
    editing: "ກຳລັງແກ້ໄຂ",
    quickJournalEntry: "ບັນທຶກລາຍການດ່ວນ",
    readyToPost: "ພ້ອມບັນທຶກ",
    date: "ວັນທີ",
    reference: "ເລກອ້າງອີງ",
    description: "ຄຳອະທິບາຍ",
    debitAccount: "ບັນຊີເດບິດ",
    debitAmount: "ຈຳນວນເດບິດ",
    creditAccount: "ບັນຊີເຄຣດິດ",
    creditAmount: "ຈຳນວນເຄຣດິດ",
    entryCanBePosted: "ລາຍການພ້ອມບັນທຶກ",
    debit: "ເດບິດ",
    credit: "ເຄຣດິດ",
    difference: "ຜົນຕ່າງ",
    clearButton: "ລ້າງ",
    saveForReview: "ບັນທຶກເພື່ອກວດ",
    updateAndPost: "ອັບເດດ ແລະ ບັນທຶກ",
    postEntry: "ບັນທຶກລາຍການ",
    savedLocally: "ບັນທຶກໃນເຄື່ອງ",
    journalRegister: "ທະບຽນສົມຸດລາຍວັນ",
    posted: "ບັນທຶກແລ້ວ",
    languageLabel: "ພາສາ",
    reportsTitle: "ລາຍງານ",
    export: "ສົ່ງອອກ",
    reportProfit: "ກຳໄລ",
    openReviewBeforeClosing: "ກວດລາຍການກ່ອນປິດບັນຊີ",
    readyForClosing: "ພ້ອມປິດບັນຊີ",
    beforeClosing: "ກ່ອນປິດບັນຊີ",
    afterClosing: "ຫຼັງປິດບັນຊີ",
    meetingDemoPath: "ເສັ້ນທາງສຳລັບສາທິດ",
    meetingDemoText: "ບັນທຶກລາຍການ ແກ້ໄຂລາຍການກວດ ແລະ ສະແດງງົບທົດລອງທີ່ປ່ຽນແປງ",
    workbookSource: "ແຫຼ່ງຂໍ້ມູນ",
    autosave: "ການປ່ຽນແປງຖືກບັນທຶກໃນ browser ນີ້",
    nav: {
      dashboard: "ໜ້າຫຼັກ",
      journal: "ສົມຸດລາຍວັນ",
      accounts: "ຜັງບັນຊີ",
      trial: "ງົບທົດລອງ",
      reports: "ລາຍງານ",
    },
    viewCopy: {
      dashboard: {
        label: "ພື້ນທີ່ສົດ",
        title: "ການປິດບັນຊີເດືອນພຶດສະພາ",
      },
      journal: {
        label: "ວຽກສົມຸດລາຍວັນ",
        title: "ບັນທຶກ ກວດທານ ແລະ ແກ້ໄຂລາຍການ",
      },
      accounts: {
        label: "ຂໍ້ມູນບັນຊີ",
        title: "ຜັງບັນຊີພ້ອມຍອດຄົງເຫຼືອສົດ",
      },
      trial: {
        label: "ການຄວບຄຸມບັນຊີ",
        title: "ງົບທົດລອງຄຳນວນຈາກລາຍການທີ່ບັນທຶກ",
      },
      reports: {
        label: "ສູນລາຍງານ",
        title: "ລາຍງານການເງິນຈາກຂໍ້ມູນບັນຊີ",
      },
    },
    workflow: {
      dataEntry: "ປ້ອນຂໍ້ມູນ",
      validation: "ກວດສອບ",
      review: "ກວດທານ",
      approved: "ອະນຸມັດ",
      posted: "ບັນທຶກແລ້ວ",
    },
    workflowValues: {
      issues: "ບັນຫາ",
      entries: "ລາຍການ",
      inProgress: "ກຳລັງດຳເນີນ",
      clear: "ປົກກະຕິ",
      posted: "ບັນທຶກແລ້ວ",
      ledgerBalanced: "ບັນຊີສົມດຸນ",
      checkLedger: "ກວດບັນຊີ",
    },
    heroSummary: ({ entries, reviewRows, balanced }) =>
      `${entries} ລາຍການບັນທຶກ - ${reviewRows} ຕ້ອງກວດ - ງົບທົດລອງ${
        balanced ? "ສົມດຸນ" : "ຕ້ອງກວດ"
      } - ລາຍງານປັບຕາມຂໍ້ມູນທີ່ບັນທຶກ`,
    issueMap: {
      "Missing description": "ຂາດຄຳອະທິບາຍ",
      "Unbalanced entry": "ລາຍການບໍ່ສົມດຸນ",
      "Missing amount": "ຂາດຈຳນວນເງິນ",
    },
    unknownAccount: "ບໍ່ພົບບັນຊີ",
    typeLabels: {
      Asset: "ຊັບສິນ",
      Liability: "ໜີ້ສິນ",
      Equity: "ທຶນ",
      Revenue: "ລາຍຮັບ",
      Expense: "ຄ່າໃຊ້ຈ່າຍ",
      Assets: "ຊັບສິນ",
      Liabilities: "ໜີ້ສິນ",
      Expenses: "ຄ່າໃຊ້ຈ່າຍ",
    },
    reportItems: {
      bankReconciliation: "ກວດທຽບທະນາຄານ",
      arAging: "ສະຫຼຸບອາຍຸລູກໜີ້",
      apAging: "ສະຫຼຸບອາຍຸໜີ້ຕ້ອງຈ່າຍ",
      inventoryValuation: "ປະເມີນມູນຄ່າສິນຄ້າ",
      journalReview: "ກວດສົມຸດລາຍວັນ",
      profitLoss: "ງົບກຳໄລຂາດທຶນ",
      balanceSheet: "ງົບດຸນ",
      cashFlow: "ງົບກະແສເງິນສົດ",
      equityStatement: "ງົບການປ່ຽນແປງທຶນ",
    },
    reportMeta: {
      ready: "ພ້ອມ",
      needsReview: "ຕ້ອງກວດ",
      open: "ເປີດ",
      autoGenerated: "ສ້າງອັດຕະໂນມັດ",
      afterReview: "ຫຼັງກວດ",
      may2025: "ພຶດສະພາ 2025",
    },
    kpi: {
      assets: "ຊັບສິນລວມ",
      liabilities: "ໜີ້ສິນ",
      equity: "ທຶນ",
      profit: "ກຳໄລສຸດທິເດືອນນີ້",
      liveChange: "+ ສົດ",
      negativeLiveChange: "- ສົດ",
    },
  },
};

const normalSideByType = {
  Asset: "debit",
  Expense: "debit",
  Liability: "credit",
  Equity: "credit",
  Revenue: "credit",
};

const extraAccounts = [
  { code: "2000", nameEn: "Accounts Payable", type: "Liability", balance: 7850000 },
  { code: "2100", nameEn: "Bank Loan", type: "Liability", balance: 4250000 },
  { code: "3000", nameEn: "Owner's Equity", type: "Equity", balance: 20000000 },
  { code: "7000", nameEn: "Service Revenue", type: "Revenue", balance: 9800000 },
  { code: "6200", nameEn: "Office Supplies", type: "Expense", balance: 1250000 },
  { code: "6400", nameEn: "Administrative Expense", type: "Expense", balance: 1575000 },
];

const baseAccounts = [
  ...excelSeed.accounts
    .filter((account) => account.nameEn && account.nameEn !== "Mapped account")
    .slice(0, 7),
  ...extraAccounts,
].map((account) => {
  const normalSide = normalSideByType[account.type] ?? "debit";
  return {
    ...account,
    displayName: account.nameEn,
    normalSide,
    openingDebit: Number(account.debit ?? (normalSide === "debit" ? account.balance : 0)),
    openingCredit: Number(account.credit ?? (normalSide === "credit" ? account.balance : 0)),
  };
});

const initialJournalEntries = [
  {
    id: "JV-2025-0502-001",
    date: "2025-05-02",
    description: "Bank loan received",
    reference: "BNK-0502",
    status: "posted",
    lines: [
      { account: "1021", side: "debit", amount: 4250000 },
      { account: "2100", side: "credit", amount: 4250000 },
    ],
  },
  {
    id: "JV-2025-0508-002",
    date: "2025-05-08",
    description: "Customer payment for monthly service",
    reference: "INV-2025-052",
    status: "posted",
    lines: [
      { account: "1011", side: "debit", amount: 9800000 },
      { account: "7000", side: "credit", amount: 9800000 },
    ],
  },
  {
    id: "JV-2025-0512-003",
    date: "2025-05-12",
    description: "Administrative expenses paid",
    reference: "EXP-0512",
    status: "posted",
    lines: [
      { account: "6400", side: "debit", amount: 1575000 },
      { account: "1011", side: "credit", amount: 1575000 },
    ],
  },
  {
    id: "JV-2025-0518-004",
    date: "2025-05-18",
    description: "",
    reference: "EXP-0518",
    status: "review",
    lines: [
      { account: "6200", side: "debit", amount: 1250000 },
      { account: "1011", side: "credit", amount: 1250000 },
    ],
  },
  {
    id: "JV-2025-0522-005",
    date: "2025-05-22",
    description: "Customer receipt entered from bank statement",
    reference: "BNK-0522",
    status: "review",
    lines: [
      { account: "1011", side: "debit", amount: 5600000 },
      { account: "7000", side: "credit", amount: 5000000 },
    ],
  },
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

function formatKip(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));
}

function formatCompactKip(value) {
  const number = Number(value) || 0;
  if (Math.abs(number) >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  return formatKip(number);
}

function money(value) {
  return `LAK ${formatKip(value)}`;
}

function getText(language) {
  return translations[language] ?? translations.English;
}

function getLanguageLabel(language) {
  return languageOptions.find((option) => option.value === language)?.label ?? language;
}

function getAccountDisplayName(account, language) {
  if (language === "Lao") {
    return laoAccountNames[account.code] ?? account.displayName;
  }
  return account.displayName;
}

function getAccountLabel(account, language = "English") {
  return `${account.code} ${getAccountDisplayName(account, language)}`;
}

function getAccountName(accountsByCode, code, language = "English") {
  const account = accountsByCode.get(code);
  return account ? getAccountLabel(account, language) : code;
}

function getTypeLabel(type, language) {
  const text = getText(language);
  return text.typeLabels[type] ?? type;
}

function getEntryDescription(description, language) {
  const text = getText(language);
  const cleanDescription = description.trim();
  if (!cleanDescription) return text.missingDescription;
  if (language === "Lao") {
    return laoJournalDescriptions[cleanDescription] ?? cleanDescription;
  }
  return cleanDescription;
}

function getIssueText(issue, language) {
  const text = getText(language);
  if (issue.startsWith("Unknown account")) {
    return `${text.unknownAccount} ${issue.replace("Unknown account", "").trim()}`;
  }
  return text.issueMap[issue] ?? issue;
}

function getIssueList(issues, language) {
  const text = getText(language);
  if (!issues.length) return text.waitingReview;
  return issues.map((issue) => getIssueText(issue, language)).join(", ");
}

function entryTotals(entry) {
  return entry.lines.reduce(
    (totals, line) => {
      const amount = Number(line.amount) || 0;
      if (line.side === "debit") {
        totals.debit += amount;
      } else {
        totals.credit += amount;
      }
      return totals;
    },
    { debit: 0, credit: 0 },
  );
}

function analyzeEntry(entry, accountsByCode) {
  const totals = entryTotals(entry);
  const issues = [];

  if (!entry.description.trim()) {
    issues.push("Missing description");
  }

  if (Math.abs(totals.debit - totals.credit) > 0.005) {
    issues.push("Unbalanced entry");
  }

  if (totals.debit <= 0 || totals.credit <= 0) {
    issues.push("Missing amount");
  }

  const unknownAccount = entry.lines.find((line) => !accountsByCode.has(line.account));
  if (unknownAccount) {
    issues.push(`Unknown account ${unknownAccount.account}`);
  }

  return {
    ...totals,
    difference: Math.abs(totals.debit - totals.credit),
    issues,
    canPost: issues.length === 0,
  };
}

function loadLedgerEntries() {
  if (typeof window === "undefined") return initialJournalEntries;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialJournalEntries;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 2 || !Array.isArray(parsed.entries)) return initialJournalEntries;
    return parsed.entries;
  } catch {
    return initialJournalEntries;
  }
}

function loadTheme() {
  if (typeof window === "undefined") return "light";

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function buildAccountRows(accounts, entries) {
  const rowsByCode = new Map(
    accounts.map((account) => [
      account.code,
      {
        ...account,
        debit: account.openingDebit,
        credit: account.openingCredit,
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
        if (line.side === "debit") {
          row.debit += amount;
        } else {
          row.credit += amount;
        }
      });
    });

  return Array.from(rowsByCode.values()).map((row) => {
    const netDebit = Math.max(row.debit - row.credit, 0);
    const netCredit = Math.max(row.credit - row.debit, 0);
    const signedBalance = row.normalSide === "debit" ? row.debit - row.credit : row.credit - row.debit;
    return {
      ...row,
      netDebit,
      netCredit,
      balance: signedBalance,
    };
  });
}

function buildTrialRows(accountRows) {
  const order = ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"];
  const labelByType = {
    Asset: "Assets",
    Liability: "Liabilities",
    Equity: "Equity",
    Revenue: "Revenue",
    Expense: "Expenses",
  };

  const groups = new Map(order.map((type) => [type, { type, debit: 0, credit: 0 }]));
  accountRows.forEach((row) => {
    const label = labelByType[row.type] ?? row.type;
    if (!groups.has(label)) groups.set(label, { type: label, debit: 0, credit: 0 });
    const group = groups.get(label);
    group.debit += row.netDebit;
    group.credit += row.netCredit;
  });

  return Array.from(groups.values()).filter((row) => row.debit > 0 || row.credit > 0);
}

function draftToEntry(draft, id, status) {
  return {
    id,
    date: draft.date,
    description: draft.description,
    reference: draft.reference,
    status,
    updatedAt: new Date().toISOString(),
    lines: [
      { account: draft.debitAccount, side: "debit", amount: Number(draft.debit) || 0 },
      { account: draft.creditAccount, side: "credit", amount: Number(draft.credit) || 0 },
    ],
  };
}

function entryToDraft(entry) {
  const debitLine = entry.lines.find((line) => line.side === "debit") ?? entry.lines[0];
  const creditLine = entry.lines.find((line) => line.side === "credit") ?? entry.lines[1] ?? entry.lines[0];
  return {
    date: entry.date,
    description: entry.description,
    reference: entry.reference,
    debitAccount: debitLine?.account ?? blankDraft.debitAccount,
    creditAccount: creditLine?.account ?? blankDraft.creditAccount,
    debit: debitLine?.amount ?? 0,
    credit: creditLine?.amount ?? 0,
  };
}

function nextJournalId(entries) {
  return `JV-2025-${String(entries.length + 1).padStart(4, "0")}`;
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
  const [theme, setTheme] = useState(loadTheme);
  const [accounts, setAccounts] = useState(baseAccounts);
  const [entries, setEntries] = useState(loadLedgerEntries);
  const [draft, setDraft] = useState(blankDraft);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [accountSearch, setAccountSearch] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("All");
  const [dataStatus, setDataStatus] = useState("loading");
  const [dataError, setDataError] = useState("");
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authStatus, setAuthStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const accountsByCode = useMemo(
    () => new Map(accounts.map((account) => [account.code, account])),
    [accounts],
  );

  const accountRows = useMemo(() => buildAccountRows(accounts, entries), [accounts, entries]);
  const trialRows = useMemo(() => buildTrialRows(accountRows), [accountRows]);
  const postedEntries = useMemo(() => entries.filter((entry) => entry.status === "posted"), [entries]);

  const reviewRows = useMemo(
    () =>
      entries
        .filter((entry) => entry.status !== "posted")
        .map((entry) => ({
          entry,
          analysis: analyzeEntry(entry, accountsByCode),
        })),
    [accountsByCode, entries],
  );

  const draftAnalysis = useMemo(
    () => analyzeEntry(draftToEntry(draft, editingEntryId ?? "DRAFT", "review"), accountsByCode),
    [accountsByCode, draft, editingEntryId],
  );

  const categoryTotals = useMemo(
    () =>
      accountRows.reduce(
        (totals, row) => {
          const safeBalance = Math.max(row.balance, 0);
          if (row.type === "Asset") totals.assets += safeBalance;
          if (row.type === "Liability") totals.liabilities += safeBalance;
          if (row.type === "Equity") totals.equity += safeBalance;
          if (row.type === "Revenue") totals.revenue += safeBalance;
          if (row.type === "Expense") totals.expenses += safeBalance;
          return totals;
        },
        { assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0 },
      ),
    [accountRows],
  );

  const totalDebits = trialRows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredits = trialRows.reduce((sum, row) => sum + row.credit, 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const isLedgerBalanced = difference < 0.005;
  const netProfit = categoryTotals.revenue - categoryTotals.expenses;
  const text = getText(language);
  const heroCopy = text.viewCopy[activeView] ?? text.viewCopy.dashboard;
  const accountTypeOptions = useMemo(
    () => ["All", ...Array.from(new Set(accountRows.map((account) => account.type)))],
    [accountRows],
  );

  const filteredAccountRows = useMemo(() => {
    const term = accountSearch.trim().toLowerCase();
    return accountRows.filter((account) => {
      const localizedName = getAccountDisplayName(account, language).toLowerCase();
      const englishName = account.displayName.toLowerCase();
      const matchesSearch =
        !term ||
        account.code.toLowerCase().includes(term) ||
        localizedName.includes(term) ||
        englishName.includes(term);
      const matchesType = accountTypeFilter === "All" || account.type === accountTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [accountRows, accountSearch, accountTypeFilter, language]);

  const accountListRows = activeView === "accounts" ? filteredAccountRows : accountRows.slice(0, 9);

  const workflow = [
    { label: text.workflow.dataEntry, value: `${entries.length} ${text.workflowValues.entries}`, state: "done" },
    {
      label: text.workflow.validation,
      value: `${reviewRows.length} ${text.workflowValues.issues}`,
      state: reviewRows.length ? "warning" : "done",
    },
    {
      label: text.workflow.review,
      value: reviewRows.length ? text.workflowValues.inProgress : text.workflowValues.clear,
      state: reviewRows.length ? "active" : "done",
    },
    {
      label: text.workflow.approved,
      value: `${postedEntries.length} ${text.workflowValues.posted}`,
      state: "done",
    },
    {
      label: text.workflow.posted,
      value: isLedgerBalanced ? text.workflowValues.ledgerBalanced : text.workflowValues.checkLedger,
      state: isLedgerBalanced ? "done" : "warning",
    },
  ];

  const reportGroups = [
    {
      title: text.beforeClosing,
      items: [
        { label: text.reportItems.bankReconciliation, status: "ready", meta: `${postedEntries.length} ${text.workflowValues.entries}` },
        { label: text.reportItems.arAging, status: "ready", meta: text.reportMeta.may2025 },
        { label: text.reportItems.apAging, status: "ready", meta: text.reportMeta.may2025 },
        {
          label: text.reportItems.inventoryValuation,
          status: reviewRows.length ? "review" : "ready",
          meta: reviewRows.length ? text.reportMeta.needsReview : text.reportMeta.ready,
        },
        {
          label: text.reportItems.journalReview,
          status: reviewRows.length ? "review" : "ready",
          meta: reviewRows.length ? `${reviewRows.length} ${text.reportMeta.open}` : text.clear,
        },
      ],
    },
    {
      title: text.afterClosing,
      items: [
        { label: text.reportItems.profitLoss, status: isLedgerBalanced ? "ready" : "locked", meta: money(netProfit) },
        { label: text.reportItems.balanceSheet, status: isLedgerBalanced ? "ready" : "locked", meta: money(categoryTotals.assets) },
        { label: text.reportItems.cashFlow, status: isLedgerBalanced ? "ready" : "locked", meta: text.reportMeta.autoGenerated },
        {
          label: text.reportItems.equityStatement,
          status: reviewRows.length ? "locked" : "ready",
          meta: reviewRows.length ? text.reportMeta.afterReview : text.reportMeta.ready,
        },
      ],
    },
  ];

  const kpis = [
    {
      label: text.kpi.assets,
      value: categoryTotals.assets,
      change: text.kpi.liveChange,
      icon: WalletCards,
      tone: "teal",
    },
    {
      label: text.kpi.liabilities,
      value: categoryTotals.liabilities,
      change: text.kpi.liveChange,
      icon: Landmark,
      tone: "blue",
    },
    {
      label: text.kpi.equity,
      value: categoryTotals.equity,
      change: text.kpi.liveChange,
      icon: Building2,
      tone: "green",
    },
    {
      label: text.kpi.profit,
      value: netProfit,
      change: netProfit >= 0 ? text.kpi.liveChange : text.kpi.negativeLiveChange,
      icon: BarChart3,
      tone: "amber",
    },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspace() {
      try {
        const workspace = await loadAccountingWorkspace();
        if (!isMounted) return;

        if (!workspace.configured) {
          setDataStatus("local");
          return;
        }

        if (workspace.accounts?.length) {
          setAccounts(workspace.accounts);
        }
        if (workspace.entries?.length) {
          setEntries(workspace.entries);
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              version: 2,
              entries: workspace.entries,
            }),
          );
        }
        setDataStatus("supabase");
      } catch (error) {
        if (!isMounted) return;
        setDataError(error?.message ?? "Could not load Supabase data");
        setDataStatus("error");
      }
    }

    loadWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const currentSession = await getCurrentSession();
        if (isMounted) setSession(currentSession);
      } catch (error) {
        if (isMounted) setAuthStatus(error?.message ?? "Could not load auth session");
      }
    }

    loadSession();
    const unsubscribe = onAuthChange((nextSession) => {
      setSession(nextSession);
      if (nextSession) setAuthStatus("");
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        entries,
      }),
    );
  }, [entries]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeView]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function resetDraft() {
    setDraft(blankDraft);
    setEditingEntryId(null);
  }

  async function commitDraft(status) {
    if (!session) {
      setAuthStatus("Sign in to save journal changes to Supabase.");
      return;
    }
    if (status === "posted" && !draftAnalysis.canPost) return;

    setIsSaving(true);
    setAuthStatus("");

    try {
      const id = editingEntryId ?? nextJournalId(entries);
      const entry = draftToEntry(draft, id, status);
      await saveJournalEntry(entry);
      setEntries((currentEntries) => {
        if (editingEntryId) {
          return currentEntries.map((item) => (item.id === editingEntryId ? entry : item));
        }
        return [entry, ...currentEntries];
      });
      resetDraft();
      setAuthStatus("Saved to Supabase.");
    } catch (error) {
      setAuthStatus(error?.message ?? "Could not save to Supabase.");
    } finally {
      setIsSaving(false);
    }
  }

  function saveDraftForReview() {
    commitDraft("review");
  }

  function postDraft() {
    commitDraft("posted");
  }

  function reviewEntry(entry) {
    setDraft(entryToDraft(entry));
    setEditingEntryId(entry.id);
    setActiveView("journal");
  }

  function resetDemoData() {
    setAccounts(baseAccounts);
    setEntries(initialJournalEntries);
    resetDraft();
    window.localStorage.removeItem(STORAGE_KEY);
    setDataStatus("local");
  }

  function exportWorkspace() {
    const payload = {
      exportedAt: new Date().toISOString(),
      language,
      accounts: accountRows,
      journalEntries: entries,
      trialBalance: trialRows,
      totals: {
        totalDebits,
        totalCredits,
        difference,
        netProfit,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "accounting-prototype-workspace.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleSignIn(event) {
    event.preventDefault();
    setAuthStatus("");
    try {
      await signInWithEmail(authEmail, authPassword);
      setAuthPassword("");
      setAuthStatus("Signed in.");
    } catch (error) {
      setAuthStatus(error?.message ?? "Could not sign in.");
    }
  }

  async function handleSignUp() {
    setAuthStatus("");
    try {
      const nextSession = await signUpWithEmail(authEmail, authPassword);
      setAuthPassword("");
      setAuthStatus(nextSession ? "Account created and signed in." : "Account created. Check your email to confirm.");
    } catch (error) {
      setAuthStatus(error?.message ?? "Could not create account.");
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      setAuthStatus("Signed out.");
    } catch (error) {
      setAuthStatus(error?.message ?? "Could not sign out.");
    }
  }

  return (
    <main
      className={`${meetingMode ? "app meeting-mode" : "app"} ${
        language === "Lao" ? "language-lao" : "language-english"
      } theme-${theme}`}
    >
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">
            <BookOpen size={24} />
          </div>
          <div>
            <strong>{text.appName}</strong>
            <span>{text.workspace}</span>
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
                aria-current={activeView === item.id ? "page" : undefined}
                aria-label={text.nav[item.id]}
                title={text.nav[item.id]}
              >
                <Icon size={19} />
                <span>{text.nav[item.id]}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-section">
          <p>{text.workflowLabel}</p>
          <div className="side-status">
            <CheckCircle2 size={17} />
            <span>{isLedgerBalanced ? text.sideTrialReady : text.sideTrialOff}</span>
          </div>
          <div className={reviewRows.length ? "side-status warning" : "side-status"}>
            {reviewRows.length ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
            <span>{reviewRows.length ? `${reviewRows.length} ${text.sideNeedReview}` : text.sideNoIssues}</span>
          </div>
        </div>

        <button className="collapse-button">
          <Menu size={18} />
          <span>{text.compactMenu}</span>
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="selectors">
            <button className="select-button">
              {text.company}
              <ChevronDown size={16} />
            </button>
            <button className="select-button">
              <CalendarDays size={17} />
              {text.period}
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="top-actions">
            <div className="segmented" aria-label={text.reportLanguage}>
              {languageOptions.map((item) => (
                <button
                  key={item.value}
                  className={language === item.value ? "selected" : ""}
                  onClick={() => setLanguage(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              className={meetingMode ? "icon-button active" : "icon-button"}
              onClick={() => setMeetingMode((value) => !value)}
              title={text.meetingMode}
            >
              <Presentation size={18} />
            </button>
            <button className="icon-button" title={text.resetDemoData} onClick={resetDemoData}>
              <RefreshCcw size={18} />
            </button>
            <button
              className="icon-button"
              data-testid="theme-toggle"
              title={theme === "dark" ? text.lightMode : text.darkMode}
              aria-label={theme === "dark" ? text.lightMode : text.darkMode}
              onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="icon-button" title={text.settings}>
              <Settings size={18} />
            </button>
            {session ? (
              <div className="auth-panel signed-in">
                <div className="profile-chip">
                  <span>AC</span>
                  {session.user.email}
                </div>
                <button className="mini-button" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            ) : (
              <form className="auth-panel" onSubmit={handleSignIn}>
                <input
                  type="email"
                  placeholder="Email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
                <button className="mini-button" type="submit">
                  Sign in
                </button>
                <button className="mini-button secondary" type="button" onClick={handleSignUp}>
                  Sign up
                </button>
              </form>
            )}
          </div>
        </header>

        <section className="hero-strip">
          <div>
            <p className="section-label">{heroCopy.label}</p>
            <h1>{heroCopy.title}</h1>
            <p>{text.heroSummary({ entries: entries.length, reviewRows: reviewRows.length, balanced: isLedgerBalanced })}</p>
            <small className={dataStatus === "error" ? "data-source warning" : "data-source"}>
              {dataStatus === "loading" && "Loading Supabase data"}
              {dataStatus === "supabase" && "Data source: Supabase"}
              {dataStatus === "local" && "Data source: local demo"}
              {dataStatus === "error" && `Supabase fallback: ${dataError}`}
            </small>
            <small className={session ? "data-source" : "data-source warning"}>
              {session ? `Signed in as ${session.user.email}` : "Read-only until you sign in"}
              {authStatus ? ` - ${authStatus}` : ""}
            </small>
          </div>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => setActiveView("journal")}>
              <ClipboardCheck size={18} />
              {text.reviewEntries}
            </button>
            <button className="secondary-button" onClick={exportWorkspace}>
              <Download size={18} />
              {text.exportData}
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
                  <strong>LAK {formatCompactKip(kpi.value)}</strong>
                  <small className={kpi.change.startsWith("-") ? "negative" : "positive"}>
                    {kpi.change} {text.afterPosting}
                  </small>
                </div>
              </article>
            );
          })}
        </section>

        <div className={`main-grid view-${activeView}`}>
          <section className="content-stack">
            <section className="panel workflow-panel">
              <div className="panel-heading">
                <div>
                  <p className="section-label">{text.guidedWorkflow}</p>
                  <h2>{text.journalWorkflow}</h2>
                </div>
                <button className="text-button" onClick={() => setActiveView("journal")}>
                  {text.viewAllIssues} ({reviewRows.length})
                </button>
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
                {reviewRows.length === 0 ? (
                  <div className="empty-state">
                    <CheckCircle2 size={22} />
                    <span>{text.allPosted}</span>
                  </div>
                ) : (
                  reviewRows.map(({ entry, analysis }) => {
                    const amount = Math.max(analysis.debit, analysis.credit);
                    const mainAccount = entry.lines[0]?.account ?? "";
                    return (
                      <article className="issue-row" key={entry.id}>
                        <div className="issue-date">
                          <strong>{entry.date.slice(8)}</strong>
                          <span>{entry.date.slice(0, 7)}</span>
                        </div>
                        <div className="issue-main">
                          <strong>{getEntryDescription(entry.description, language)}</strong>
                          <span>
                            {entry.id} - {getAccountName(accountsByCode, mainAccount, language)}
                          </span>
                        </div>
                        <div className="issue-state">
                          <AlertTriangle size={16} />
                          <span>{getIssueList(analysis.issues, language)}</span>
                        </div>
                        <div className="issue-amount">
                          <strong>{money(amount)}</strong>
                          <button className="mini-button" onClick={() => reviewEntry(entry)}>
                            {text.review}
                          </button>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section className="split-row">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-label">{text.sourceWorkbook}</p>
                    <h2>{text.chartOfAccounts}</h2>
                  </div>
                  {activeView === "accounts" ? (
                    <span className="status-pill neutral">
                      {filteredAccountRows.length} {text.accountsShown}
                    </span>
                  ) : (
                    <button className="text-button" onClick={() => setActiveView("accounts")}>
                      {text.viewAll}
                    </button>
                  )}
                </div>
                {activeView === "accounts" && (
                  <div className="account-toolbar">
                    <label>
                      {text.searchAccounts}
                      <input
                        value={accountSearch}
                        onChange={(event) => setAccountSearch(event.target.value)}
                      />
                    </label>
                    <label>
                      {text.accountType}
                      <select
                        value={accountTypeFilter}
                        onChange={(event) => setAccountTypeFilter(event.target.value)}
                      >
                        {accountTypeOptions.map((type) => (
                          <option key={type} value={type}>
                            {type === "All" ? text.allTypes : getTypeLabel(type, language)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
                <div className="account-list">
                  {accountListRows.map((account) => (
                    <div className="account-row" key={account.code}>
                      <span className="account-code">{account.code}</span>
                      <div>
                        <strong>{getAccountDisplayName(account, language)}</strong>
                        <small>{getTypeLabel(account.type, language)}</small>
                      </div>
                      <span className={account.balance < 0 ? "amount negative" : "amount"}>
                        {money(Math.abs(account.balance))}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <p className="section-label">{text.asOf}</p>
                    <h2>{text.trialBalance}</h2>
                  </div>
                  <span className={isLedgerBalanced ? "status-pill success" : "status-pill warning"}>
                    {isLedgerBalanced ? text.balanced : text.needsReview}
                  </span>
                </div>
                <div className="trial-list">
                  {trialRows.map((row) => (
                    <div className="trial-row" key={row.type}>
                      <div>
                        <strong>{getTypeLabel(row.type, language)}</strong>
                        <span>
                          {text.debitShort} {money(row.debit)} - {text.creditShort} {money(row.credit)}
                        </span>
                      </div>
                      <em>{row.debit || row.credit ? text.live : text.clear}</em>
                    </div>
                  ))}
                  <div className={isLedgerBalanced ? "balance-result" : "balance-result warning"}>
                    {isLedgerBalanced ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                    <div>
                      <strong>{isLedgerBalanced ? text.balanced : text.differenceFound}</strong>
                      <span>
                        {text.totalDebits} {isLedgerBalanced ? text.equal : text.doNotEqual} {text.totalCredits}
                      </span>
                    </div>
                    <b>{money(difference)}</b>
                  </div>
                </div>
              </section>
            </section>

            <section className="panel journal-builder">
              <div className="panel-heading">
                <div>
                  <p className="section-label">{editingEntryId ? `${text.editing} ${editingEntryId}` : text.liveValidation}</p>
                  <h2>{text.quickJournalEntry}</h2>
                </div>
                <span className={draftAnalysis.canPost ? "status-pill success" : "status-pill warning"}>
                  {draftAnalysis.canPost ? text.readyToPost : text.needsReview}
                </span>
              </div>

              <div className="entry-grid">
                <label>
                  {text.date}
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(event) => updateDraft("date", event.target.value)}
                  />
                </label>
                <label>
                  {text.reference}
                  <input
                    value={draft.reference}
                    onChange={(event) => updateDraft("reference", event.target.value)}
                  />
                </label>
                <label className="wide-field">
                  {text.description}
                  <input
                    value={draft.description}
                    onChange={(event) => updateDraft("description", event.target.value)}
                  />
                </label>
                <label>
                  {text.debitAccount}
                  <select
                    value={draft.debitAccount}
                    onChange={(event) => updateDraft("debitAccount", event.target.value)}
                  >
                    {accounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {getAccountLabel(account, language)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {text.debitAmount}
                  <input
                    type="number"
                    min="0"
                    value={draft.debit}
                    onChange={(event) => updateDraft("debit", event.target.value)}
                  />
                </label>
                <label>
                  {text.creditAccount}
                  <select
                    value={draft.creditAccount}
                    onChange={(event) => updateDraft("creditAccount", event.target.value)}
                  >
                    {accounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {getAccountLabel(account, language)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {text.creditAmount}
                  <input
                    type="number"
                    min="0"
                    value={draft.credit}
                    onChange={(event) => updateDraft("credit", event.target.value)}
                  />
                </label>
              </div>

              <div className={draftAnalysis.canPost ? "validation-box success" : "validation-box warning"}>
                {draftAnalysis.canPost ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                <div>
                  <strong>{draftAnalysis.canPost ? text.entryCanBePosted : getIssueList(draftAnalysis.issues, language)}</strong>
                  <span>
                    {text.debit} {money(draftAnalysis.debit)} - {text.credit} {money(draftAnalysis.credit)} -{" "}
                    {text.difference} {money(draftAnalysis.difference)}
                  </span>
                </div>
              </div>

              <div className="form-actions">
                <button className="secondary-button" onClick={resetDraft}>
                  <RefreshCcw size={17} />
                  {text.clearButton}
                </button>
                <button className="secondary-button" onClick={saveDraftForReview} disabled={!session || isSaving}>
                  <Save size={17} />
                  {isSaving ? "Saving" : text.saveForReview}
                </button>
                <button className="primary-button" onClick={postDraft} disabled={!draftAnalysis.canPost || !session || isSaving}>
                  <PlusCircle size={17} />
                  {isSaving ? "Saving" : editingEntryId ? text.updateAndPost : text.postEntry}
                </button>
              </div>
            </section>

            <section className="panel journal-ledger">
              <div className="panel-heading">
                <div>
                  <p className="section-label">{session ? "Saved to Supabase" : "Read-only preview"}</p>
                  <h2>{text.journalRegister}</h2>
                </div>
                <span className="status-pill neutral">{postedEntries.length} {text.workflowValues.posted}</span>
              </div>
              <div className="journal-table">
                {entries.map((entry) => {
                  const analysis = analyzeEntry(entry, accountsByCode);
                  return (
                    <article className="journal-row" key={entry.id}>
                      <div>
                        <strong>{entry.id}</strong>
                        <span>{entry.date}</span>
                      </div>
                      <div>
                        <strong>{getEntryDescription(entry.description, language)}</strong>
                        <span>{entry.reference}</span>
                      </div>
                      <div>
                        <strong>{text.debitShort} {money(analysis.debit)}</strong>
                        <span>{text.creditShort} {money(analysis.credit)}</span>
                      </div>
                      <span className={entry.status === "posted" ? "status-pill success" : "status-pill warning"}>
                        {entry.status === "posted" ? text.posted : text.review}
                      </span>
                    </article>
                  );
                })}
              </div>
            </section>
          </section>

          <aside className="reports-rail">
            <div className="panel-heading">
              <div>
                <p className="section-label">{text.languageLabel}: {getLanguageLabel(language)}</p>
                <h2>{text.reportsTitle}</h2>
              </div>
              <button className="mini-button export" onClick={exportWorkspace}>
                <Download size={16} />
                {text.export}
              </button>
            </div>

            <div className="report-summary">
              <span>{text.reportProfit}</span>
              <strong>{money(netProfit)}</strong>
              <small>{reviewRows.length ? text.openReviewBeforeClosing : text.readyForClosing}</small>
            </div>

            {reportGroups.map((group) => (
              <section className="report-group" key={group.title}>
                <h3>{group.title}</h3>
                {group.items.map((item, index) => (
                  <div className="report-item" key={item.label}>
                    <StatusIcon status={item.status} />
                    <span>
                      {index + 1}. {item.label}
                    </span>
                    <small>{item.meta}</small>
                  </div>
                ))}
              </section>
            ))}

            <div className="meeting-note">
              <Sparkles size={18} />
              <div>
                <strong>{text.meetingDemoPath}</strong>
                <span>{text.meetingDemoText}</span>
              </div>
            </div>
          </aside>
        </div>

        <footer className="footer-line">
          <span>{text.workbookSource}: {excelSeed.sourceFile}</span>
          <span>{text.autosave}</span>
        </footer>
      </section>
    </main>
  );
}

export default App;
