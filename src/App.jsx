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
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  { id: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { id: "journal", labelKey: "nav.journal", icon: ReceiptText },
  { id: "sales", labelKey: "nav.sales", icon: FileText },
  { id: "purchases", labelKey: "nav.purchases", icon: ClipboardList },
  { id: "accounts", labelKey: "nav.accounts", icon: Table2 },
  { id: "trial", labelKey: "nav.trial", icon: Scale },
  { id: "reports", labelKey: "nav.reports", icon: FileSpreadsheet },
  { id: "team", labelKey: "nav.team", icon: Users },
  { id: "audit", labelKey: "nav.audit", icon: History },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
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

const pageTitleKeys = {
  dashboard: "page.dashboard",
  journal: "page.journal",
  sales: "page.sales",
  purchases: "page.purchases",
  accounts: "page.accounts",
  trial: "page.trial",
  reports: "page.reports",
  team: "page.team",
  audit: "page.audit",
  settings: "page.settings",
};

const roleOptions = ["owner", "admin", "accountant", "reviewer", "viewer"];
const accountTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
const normalSides = ["debit", "credit"];
const languageOptions = [
  { code: "en", label: "English" },
  { code: "lo", label: "ລາວ" },
];

const defaultUserSettings = {
  darkMode: false,
  compactMode: false,
  largeText: false,
  language: "en",
};

const translations = {
  en: {
    "app.name": "Lao Accounting",
    "nav.dashboard": "Dashboard",
    "nav.journal": "Journal",
    "nav.sales": "Sales",
    "nav.purchases": "Purchases",
    "nav.accounts": "Chart of Accounts",
    "nav.trial": "Trial Balance",
    "nav.reports": "Reports",
    "nav.team": "Team",
    "nav.audit": "Audit",
    "nav.settings": "Settings",
    "page.dashboard": "Dashboard",
    "page.journal": "Journal",
    "page.sales": "Sales",
    "page.purchases": "Purchases",
    "page.accounts": "Chart of Accounts",
    "page.trial": "Trial Balance",
    "page.reports": "Reports",
    "page.team": "Team",
    "page.audit": "Audit",
    "page.settings": "Settings",
    "common.email": "Email",
    "common.password": "Password",
    "common.phone": "Phone",
    "common.status": "Status",
    "common.actions": "Actions",
    "common.date": "Date",
    "common.description": "Description",
    "common.amount": "Amount",
    "common.total": "Total",
    "common.subtotal": "Subtotal",
    "common.reference": "Reference",
    "common.notes": "Notes",
    "common.role": "Role",
    "common.company": "Company",
    "common.name": "Name",
    "common.code": "Code",
    "common.account": "Account",
    "common.debit": "Debit",
    "common.credit": "Credit",
    "common.balance": "Balance",
    "common.value": "Value",
    "common.report": "Report",
    "common.period": "Period",
    "common.ledger": "Ledger",
    "common.issue": "Issue",
    "common.due": "Due",
    "common.signOut": "Sign out",
    "common.loadingWorkspace": "Loading workspace data",
    "common.noCompany": "No company assigned",
    "common.member": "Member",
    "common.system": "System",
    "common.saving": "Saving",
    "common.ready": "Ready",
    "common.draft": "Draft",
    "common.readOnly": "Read only",
    "common.adminAccess": "Admin access",
    "period.may2025": "May 2025",
    "auth.subtitle": "Sign in to open the accounting workspace.",
    "auth.signIn": "Sign in",
    "auth.createAccount": "Create account",
    "auth.accountCreated": "Account created.",
    "auth.confirmEmail": "Check your email to confirm your account.",
    "auth.signInError": "Could not sign in.",
    "auth.signUpError": "Could not create account.",
    "onboarding.title": "Set up workspace",
    "onboarding.subtitle": "Create a company or accept an invitation.",
    "onboarding.companyName": "Company name",
    "onboarding.createCompany": "Create company",
    "onboarding.pendingInvitations": "Pending invitations",
    "onboarding.noPendingInvitations": "No pending invitations for this email.",
    "onboarding.accept": "Accept",
    "onboarding.companyCreated": "Company created.",
    "onboarding.companyCreateError": "Could not create company.",
    "onboarding.invitationAccepted": "Invitation accepted.",
    "onboarding.invitationAcceptError": "Could not accept invitation.",
    "dashboard.assets": "Assets",
    "dashboard.liabilities": "Liabilities",
    "dashboard.equity": "Equity",
    "dashboard.profit": "Profit",
    "dashboard.trialStatus": "Trial Balance Status",
    "dashboard.balanced": "Balanced",
    "dashboard.needsReview": "Needs review",
    "dashboard.totalDebits": "Total Debits",
    "dashboard.totalCredits": "Total Credits",
    "dashboard.netDifference": "Net Difference",
    "dashboard.reviewQueue": "Review queue",
    "dashboard.entriesNeedAttention": ({ count }) => `${count} entries need attention`,
    "dashboard.postEntry": "Post entry",
    "dashboard.noReviewItems": "No review items",
    "dashboard.recentEntries": "Recent journal entries",
    "dashboard.latestActivity": "Latest journal activity",
    "dashboard.viewAll": "View all",
    "dashboard.noJournalEntries": "No journal entries",
    "dashboard.reportsSubtitle": "Generated from ledger rows",
    "journal.editEntry": "Edit entry",
    "journal.postEntry": "Post entry",
    "journal.savedToSupabase": "Signed-in changes are saved to the database.",
    "journal.readOnly": "Your role has read-only journal access.",
    "journal.debitAccount": "Debit account",
    "journal.debitAmount": "Debit amount",
    "journal.creditAccount": "Credit account",
    "journal.creditAmount": "Credit amount",
    "journal.validation": ({ debit, credit, difference }) => `Debit ${debit} - Credit ${credit} - Difference ${difference}`,
    "journal.cancelEdit": "Cancel edit",
    "journal.saveForReview": "Save for review",
    "journal.register": "Journal register",
    "journal.entries": ({ count }) => `${count} entries`,
    "journal.entryNo": "Entry No.",
    "journal.missingDescription": "Missing description",
    "journal.editTitle": "Edit entry",
    "journal.voidTitle": "Void entry",
    "sales.addCustomer": "Add customer",
    "sales.customerHelp": "Create billing profiles for sales invoices.",
    "sales.customerReadOnly": "Your role has read-only sales access.",
    "sales.customerName": "Customer name",
    "sales.billingAddress": "Billing address",
    "sales.saveCustomer": "Save customer",
    "sales.draftInvoice": "Draft invoice",
    "sales.invoiceHelp": "Posting creates accounts receivable and revenue journal lines.",
    "sales.invoiceNumber": "Invoice number",
    "sales.customer": "Customer",
    "sales.selectCustomer": "Select customer",
    "sales.issueDate": "Issue date",
    "sales.dueDate": "Due date",
    "sales.taxAmount": "Tax amount",
    "sales.description": "Description",
    "sales.quantity": "Quantity",
    "sales.unitPrice": "Unit price",
    "sales.lineTotal": "Line total",
    "sales.removeLine": "Remove line",
    "sales.addLine": "Add line",
    "sales.saveInvoice": "Save invoice",
    "sales.invoices": "Sales invoices",
    "sales.invoiceCount": ({ count }) => `${count} invoices`,
    "sales.invoice": "Invoice",
    "sales.unknownCustomer": "Unknown customer",
    "sales.post": "Post",
    "sales.notPosted": "Not posted",
    "sales.noInvoices": "No sales invoices",
    "sales.customers": "Customers",
    "sales.customerCount": ({ count }) => `${count} billing profiles`,
    "sales.noCustomers": "No customers",
    "sales.noEmail": "No email",
    "sales.noPhone": "No phone",
    "sales.customerRequired": "Customer name is required.",
    "sales.customerSaved": "Customer saved.",
    "sales.customerSaveError": "Could not save customer.",
    "sales.invoiceRequired": "Invoice number and customer are required.",
    "sales.invoiceDatesInvalid": "Invoice dates are invalid.",
    "sales.invoiceLinesInvalid": "Every invoice line needs a description, positive quantity, and non-negative unit price.",
    "sales.invoiceSubtotalInvalid": "Invoice subtotal must be greater than zero.",
    "sales.invoiceSaved": "Invoice saved as draft.",
    "sales.invoiceSaveError": "Could not save invoice.",
    "sales.invoicePosted": ({ entryNo }) => `Invoice posted to ${entryNo}.`,
    "sales.invoicePostError": "Could not post invoice.",
    "purchases.addVendor": "Add vendor",
    "purchases.vendorHelp": "Create supplier profiles for purchase bills.",
    "purchases.vendorReadOnly": "Your role has read-only purchase access.",
    "purchases.vendorName": "Vendor name",
    "purchases.taxId": "Tax ID",
    "purchases.saveVendor": "Save vendor",
    "purchases.draftBill": "Draft bill",
    "purchases.billHelp": "Posting creates expense, input tax, and accounts payable lines.",
    "purchases.billNumber": "Bill number",
    "purchases.vendor": "Vendor",
    "purchases.selectVendor": "Select vendor",
    "purchases.billDate": "Bill date",
    "purchases.unitCost": "Unit cost",
    "purchases.saveBill": "Save bill",
    "purchases.bills": "Purchase bills",
    "purchases.billCount": ({ count }) => `${count} bills`,
    "purchases.bill": "Bill",
    "purchases.unknownVendor": "Unknown vendor",
    "purchases.noBills": "No purchase bills",
    "purchases.vendors": "Vendors",
    "purchases.vendorCount": ({ count }) => `${count} supplier profiles`,
    "purchases.noVendors": "No vendors",
    "purchases.vendorRequired": "Vendor name is required.",
    "purchases.vendorSaved": "Vendor saved.",
    "purchases.vendorSaveError": "Could not save vendor.",
    "purchases.billRequired": "Bill number and vendor are required.",
    "purchases.billDatesInvalid": "Bill dates are invalid.",
    "purchases.billLinesInvalid": "Every bill line needs an account, description, positive quantity, and non-negative unit cost.",
    "purchases.billSubtotalInvalid": "Bill subtotal must be greater than zero.",
    "purchases.billSaved": "Bill saved as draft.",
    "purchases.billSaveError": "Could not save bill.",
    "purchases.billPosted": ({ entryNo }) => `Bill posted to ${entryNo}.`,
    "purchases.billPostError": "Could not post bill.",
    "accounts.editAccount": "Edit account",
    "accounts.addAccount": "Add account",
    "accounts.help": "Maintain the company chart of accounts.",
    "accounts.readOnly": "Your role has read-only account access.",
    "accounts.type": "Type",
    "accounts.normalSide": "Normal side",
    "accounts.openingDebit": "Opening debit",
    "accounts.openingCredit": "Opening credit",
    "accounts.saveAccount": "Save account",
    "accounts.count": ({ count }) => `${count} accounts`,
    "accounts.required": "Account code and name are required.",
    "accounts.saved": "Account saved.",
    "accounts.saveError": "Could not save account.",
    "accounts.deleteAccount": "Delete account",
    "accounts.deleted": "Account deleted.",
    "accounts.deleteError": "Could not delete account. Accounts used by journal lines are protected.",
    "trial.subtitle": "Debits and credits recalculated from posted entries",
    "trial.difference": ({ amount }) => `Difference ${amount}`,
    "trial.group": "Group",
    "reports.subtitle": "Ready reports use current ledger rows.",
    "reports.closeReadiness": "Close readiness",
    "reports.totalDebits": "Total debits",
    "reports.totalCredits": "Total credits",
    "reports.netProfit": "Net profit",
    "report.profitLoss": "Profit & Loss",
    "report.balanceSheet": "Balance Sheet",
    "report.trialBalance": "Trial Balance",
    "report.cashFlow": "Cash Flow Statement",
    "report.pendingClose": "Pending close",
    "team.addMember": "Add team member",
    "team.help": "Create a pending invitation for a teammate.",
    "team.readOnly": "Only owners and admins can manage team members.",
    "team.createInvitation": "Create invitation",
    "team.pendingInvitations": "Pending invitations",
    "team.openInvites": ({ count }) => `${count} open invites`,
    "team.noPendingInvitations": "No pending invitations",
    "team.companyTeam": ({ company }) => `${company} team`,
    "team.memberCount": ({ count }) => `${count} members`,
    "team.noMembers": "No team members",
    "team.removeMember": "Remove member",
    "team.emailRequired": "Email is required.",
    "team.invitationSaved": "Invitation saved.",
    "team.addError": "Could not add team member.",
    "team.roleUpdated": "Role updated.",
    "team.roleUpdateError": "Could not update role.",
    "team.memberRemoved": "Team member removed.",
    "team.memberRemoveError": "Could not remove team member.",
    "audit.title": "Audit history",
    "audit.subtitle": "Latest company changes captured by database triggers.",
    "audit.time": "Time",
    "audit.actor": "Actor",
    "audit.action": "Action",
    "audit.entity": "Entity",
    "audit.record": "Record",
    "audit.empty": "No audit events yet",
    "settings.appearance": "Appearance",
    "settings.appearanceSubtitle": "Preferences stay on this browser.",
    "settings.language": "Language",
    "settings.languageHelp": "Switch workspace labels between English and Lao.",
    "settings.darkMode": "Dark mode",
    "settings.darkModeHelp": "Use a darker workspace palette.",
    "settings.compactLayout": "Compact layout",
    "settings.compactLayoutHelp": "Reduce padding for denser tables and panels.",
    "settings.largerText": "Larger text",
    "settings.largerTextHelp": "Increase app text size for readability.",
    "settings.workspace": "Workspace",
    "settings.workspaceSubtitle": "Current signed-in context.",
    "status.posted": "posted",
    "status.review": "review",
    "status.draft": "draft",
    "status.void": "void",
    "status.sent": "sent",
    "status.paid": "paid",
    "status.approved": "approved",
    "status.active": "Active",
    "status.inactive": "Inactive",
    "status.pending": "pending",
    "status.accepted": "accepted",
    "status.revoked": "revoked",
    "role.owner": "Owner",
    "role.admin": "Admin",
    "role.accountant": "Accountant",
    "role.reviewer": "Reviewer",
    "role.viewer": "Viewer",
    "role.member": "Member",
    "accountType.Asset": "Asset",
    "accountType.Liability": "Liability",
    "accountType.Equity": "Equity",
    "accountType.Revenue": "Revenue",
    "accountType.Expense": "Expense",
    "accountGroup.Assets": "Assets",
    "accountGroup.Liabilities": "Liabilities",
    "accountGroup.Equity": "Equity",
    "accountGroup.Revenue": "Revenue",
    "accountGroup.Expenses": "Expenses",
    "side.debit": "debit",
    "side.credit": "credit",
  },
  lo: {
    "app.name": "ບັນຊີລາວ",
    "nav.dashboard": "ໜ້າຫຼັກ",
    "nav.journal": "ບັນທຶກບັນຊີ",
    "nav.sales": "ຂາຍ",
    "nav.purchases": "ຊື້",
    "nav.accounts": "ຜັງບັນຊີ",
    "nav.trial": "ດຸນທົດລອງ",
    "nav.reports": "ລາຍງານ",
    "nav.team": "ທີມ",
    "nav.audit": "ປະຫວັດກວດສອບ",
    "nav.settings": "ຕັ້ງຄ່າ",
    "page.dashboard": "ໜ້າຫຼັກ",
    "page.journal": "ບັນທຶກບັນຊີ",
    "page.sales": "ຂາຍ",
    "page.purchases": "ຊື້",
    "page.accounts": "ຜັງບັນຊີ",
    "page.trial": "ດຸນທົດລອງ",
    "page.reports": "ລາຍງານ",
    "page.team": "ທີມ",
    "page.audit": "ປະຫວັດກວດສອບ",
    "page.settings": "ຕັ້ງຄ່າ",
    "common.email": "ອີເມວ",
    "common.password": "ລະຫັດຜ່ານ",
    "common.phone": "ເບີໂທ",
    "common.status": "ສະຖານະ",
    "common.actions": "ການດຳເນີນການ",
    "common.date": "ວັນທີ",
    "common.description": "ລາຍລະອຽດ",
    "common.amount": "ຈຳນວນເງິນ",
    "common.total": "ລວມ",
    "common.subtotal": "ລວມຍ່ອຍ",
    "common.reference": "ເລກອ້າງອີງ",
    "common.notes": "ໝາຍເຫດ",
    "common.role": "ບົດບາດ",
    "common.company": "ບໍລິສັດ",
    "common.name": "ຊື່",
    "common.code": "ລະຫັດ",
    "common.account": "ບັນຊີ",
    "common.debit": "ເດບິດ",
    "common.credit": "ເຄຣດິດ",
    "common.balance": "ຍອດຄົງເຫຼືອ",
    "common.value": "ມູນຄ່າ",
    "common.report": "ລາຍງານ",
    "common.period": "ງວດ",
    "common.ledger": "ບັນຊີແຍກປະເພດ",
    "common.issue": "ອອກ",
    "common.due": "ຄົບກຳນົດ",
    "common.signOut": "ອອກຈາກລະບົບ",
    "common.loadingWorkspace": "ກຳລັງໂຫຼດຂໍ້ມູນພື້ນທີ່ວຽກ",
    "common.noCompany": "ຍັງບໍ່ມີບໍລິສັດ",
    "common.member": "ສະມາຊິກ",
    "common.system": "ລະບົບ",
    "common.saving": "ກຳລັງບັນທຶກ",
    "common.ready": "ພ້ອມ",
    "common.draft": "ຮ່າງ",
    "common.readOnly": "ອ່ານເທົ່ານັ້ນ",
    "common.adminAccess": "ສິດຜູ້ດູແລ",
    "period.may2025": "ພຶດສະພາ 2025",
    "auth.subtitle": "ເຂົ້າສູ່ລະບົບເພື່ອເປີດພື້ນທີ່ວຽກບັນຊີ.",
    "auth.signIn": "ເຂົ້າສູ່ລະບົບ",
    "auth.createAccount": "ສ້າງບັນຊີ",
    "auth.accountCreated": "ສ້າງບັນຊີແລ້ວ.",
    "auth.confirmEmail": "ກວດອີເມວເພື່ອຢືນຢັນບັນຊີ.",
    "auth.signInError": "ບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້.",
    "auth.signUpError": "ບໍ່ສາມາດສ້າງບັນຊີໄດ້.",
    "onboarding.title": "ຕັ້ງຄ່າພື້ນທີ່ວຽກ",
    "onboarding.subtitle": "ສ້າງບໍລິສັດ ຫຼື ຮັບຄຳເຊີນ.",
    "onboarding.companyName": "ຊື່ບໍລິສັດ",
    "onboarding.createCompany": "ສ້າງບໍລິສັດ",
    "onboarding.pendingInvitations": "ຄຳເຊີນທີ່ລໍຖ້າ",
    "onboarding.noPendingInvitations": "ບໍ່ມີຄຳເຊີນສຳລັບອີເມວນີ້.",
    "onboarding.accept": "ຮັບ",
    "onboarding.companyCreated": "ສ້າງບໍລິສັດແລ້ວ.",
    "onboarding.companyCreateError": "ບໍ່ສາມາດສ້າງບໍລິສັດໄດ້.",
    "onboarding.invitationAccepted": "ຮັບຄຳເຊີນແລ້ວ.",
    "onboarding.invitationAcceptError": "ບໍ່ສາມາດຮັບຄຳເຊີນໄດ້.",
    "dashboard.assets": "ຊັບສິນ",
    "dashboard.liabilities": "ໜີ້ສິນ",
    "dashboard.equity": "ທຶນ",
    "dashboard.profit": "ກຳໄລ",
    "dashboard.trialStatus": "ສະຖານະດຸນທົດລອງ",
    "dashboard.balanced": "ສົມດຸນ",
    "dashboard.needsReview": "ຕ້ອງກວດສອບ",
    "dashboard.totalDebits": "ເດບິດລວມ",
    "dashboard.totalCredits": "ເຄຣດິດລວມ",
    "dashboard.netDifference": "ສ່ວນຕ່າງສຸດທິ",
    "dashboard.reviewQueue": "ລາຍການລໍກວດ",
    "dashboard.entriesNeedAttention": ({ count }) => `${count} ລາຍການຕ້ອງກວດສອບ`,
    "dashboard.postEntry": "ບັນທຶກລາຍການ",
    "dashboard.noReviewItems": "ບໍ່ມີລາຍການລໍກວດ",
    "dashboard.recentEntries": "ລາຍການບັນຊີຫຼ້າສຸດ",
    "dashboard.latestActivity": "ກິດຈະກຳບັນຊີຫຼ້າສຸດ",
    "dashboard.viewAll": "ເບິ່ງທັງໝົດ",
    "dashboard.noJournalEntries": "ບໍ່ມີລາຍການບັນຊີ",
    "dashboard.reportsSubtitle": "ສ້າງຈາກລາຍການໃນບັນຊີ",
    "journal.editEntry": "ແກ້ໄຂລາຍການ",
    "journal.postEntry": "ບັນທຶກລາຍການ",
    "journal.savedToSupabase": "ການປ່ຽນແປງຖືກບັນທຶກໃນຖານຂໍ້ມູນ.",
    "journal.readOnly": "ບົດບາດຂອງທ່ານອ່ານບັນທຶກໄດ້ເທົ່ານັ້ນ.",
    "journal.debitAccount": "ບັນຊີເດບິດ",
    "journal.debitAmount": "ຈຳນວນເດບິດ",
    "journal.creditAccount": "ບັນຊີເຄຣດິດ",
    "journal.creditAmount": "ຈຳນວນເຄຣດິດ",
    "journal.validation": ({ debit, credit, difference }) => `ເດບິດ ${debit} - ເຄຣດິດ ${credit} - ສ່ວນຕ່າງ ${difference}`,
    "journal.cancelEdit": "ຍົກເລີກການແກ້ໄຂ",
    "journal.saveForReview": "ບັນທຶກເພື່ອກວດສອບ",
    "journal.register": "ທະບຽນບັນທຶກ",
    "journal.entries": ({ count }) => `${count} ລາຍການ`,
    "journal.entryNo": "ເລກທີລາຍການ",
    "journal.missingDescription": "ຂາດລາຍລະອຽດ",
    "journal.editTitle": "ແກ້ໄຂລາຍການ",
    "journal.voidTitle": "ຍົກເລີກລາຍການ",
    "sales.addCustomer": "ເພີ່ມລູກຄ້າ",
    "sales.customerHelp": "ສ້າງໂປຣໄຟລ໌ຮຽກເກັບເງິນສຳລັບໃບແຈ້ງໜີ້.",
    "sales.customerReadOnly": "ບົດບາດຂອງທ່ານອ່ານຂາຍໄດ້ເທົ່ານັ້ນ.",
    "sales.customerName": "ຊື່ລູກຄ້າ",
    "sales.billingAddress": "ທີ່ຢູ່ຮຽກເກັບເງິນ",
    "sales.saveCustomer": "ບັນທຶກລູກຄ້າ",
    "sales.draftInvoice": "ໃບແຈ້ງໜີ້ຮ່າງ",
    "sales.invoiceHelp": "ການໂພສຈະສ້າງລາຍການລູກໜີ້ ແລະ ລາຍຮັບ.",
    "sales.invoiceNumber": "ເລກໃບແຈ້ງໜີ້",
    "sales.customer": "ລູກຄ້າ",
    "sales.selectCustomer": "ເລືອກລູກຄ້າ",
    "sales.issueDate": "ວັນທີອອກ",
    "sales.dueDate": "ວັນຄົບກຳນົດ",
    "sales.taxAmount": "ພາສີ",
    "sales.description": "ລາຍລະອຽດ",
    "sales.quantity": "ຈຳນວນ",
    "sales.unitPrice": "ລາຄາຕໍ່ໜ່ວຍ",
    "sales.lineTotal": "ລວມແຖວ",
    "sales.removeLine": "ລຶບແຖວ",
    "sales.addLine": "ເພີ່ມແຖວ",
    "sales.saveInvoice": "ບັນທຶກໃບແຈ້ງໜີ້",
    "sales.invoices": "ໃບແຈ້ງໜີ້ຂາຍ",
    "sales.invoiceCount": ({ count }) => `${count} ໃບແຈ້ງໜີ້`,
    "sales.invoice": "ໃບແຈ້ງໜີ້",
    "sales.unknownCustomer": "ບໍ່ຮູ້ລູກຄ້າ",
    "sales.post": "ໂພສ",
    "sales.notPosted": "ຍັງບໍ່ໂພສ",
    "sales.noInvoices": "ບໍ່ມີໃບແຈ້ງໜີ້ຂາຍ",
    "sales.customers": "ລູກຄ້າ",
    "sales.customerCount": ({ count }) => `${count} ໂປຣໄຟລ໌ຮຽກເກັບເງິນ`,
    "sales.noCustomers": "ບໍ່ມີລູກຄ້າ",
    "sales.noEmail": "ບໍ່ມີອີເມວ",
    "sales.noPhone": "ບໍ່ມີເບີໂທ",
    "sales.customerRequired": "ຕ້ອງມີຊື່ລູກຄ້າ.",
    "sales.customerSaved": "ບັນທຶກລູກຄ້າແລ້ວ.",
    "sales.customerSaveError": "ບໍ່ສາມາດບັນທຶກລູກຄ້າໄດ້.",
    "sales.invoiceRequired": "ຕ້ອງມີເລກໃບແຈ້ງໜີ້ ແລະ ລູກຄ້າ.",
    "sales.invoiceDatesInvalid": "ວັນທີໃບແຈ້ງໜີ້ບໍ່ຖືກຕ້ອງ.",
    "sales.invoiceLinesInvalid": "ແຕ່ລະແຖວຕ້ອງມີລາຍລະອຽດ, ຈຳນວນບວກ, ແລະ ລາຄາບໍ່ຕິດລົບ.",
    "sales.invoiceSubtotalInvalid": "ລວມຍ່ອຍຂອງໃບແຈ້ງໜີ້ຕ້ອງຫຼາຍກວ່າສູນ.",
    "sales.invoiceSaved": "ບັນທຶກໃບແຈ້ງໜີ້ເປັນຮ່າງແລ້ວ.",
    "sales.invoiceSaveError": "ບໍ່ສາມາດບັນທຶກໃບແຈ້ງໜີ້ໄດ້.",
    "sales.invoicePosted": ({ entryNo }) => `ໂພສໃບແຈ້ງໜີ້ໄປທີ່ ${entryNo}.`,
    "sales.invoicePostError": "ບໍ່ສາມາດໂພສໃບແຈ້ງໜີ້ໄດ້.",
    "purchases.addVendor": "ເພີ່ມຜູ້ຂາຍ",
    "purchases.vendorHelp": "ສ້າງໂປຣໄຟລ໌ຜູ້ຂາຍສຳລັບໃບບິນຊື້.",
    "purchases.vendorReadOnly": "ບົດບາດຂອງທ່ານອ່ານການຊື້ໄດ້ເທົ່ານັ້ນ.",
    "purchases.vendorName": "ຊື່ຜູ້ຂາຍ",
    "purchases.taxId": "ເລກພາສີ",
    "purchases.saveVendor": "ບັນທຶກຜູ້ຂາຍ",
    "purchases.draftBill": "ໃບບິນຮ່າງ",
    "purchases.billHelp": "ການໂພສຈະສ້າງລາຍການຄ່າໃຊ້ຈ່າຍ, ພາສີຂາເຂົ້າ, ແລະ ເຈົ້າໜີ້.",
    "purchases.billNumber": "ເລກໃບບິນ",
    "purchases.vendor": "ຜູ້ຂາຍ",
    "purchases.selectVendor": "ເລືອກຜູ້ຂາຍ",
    "purchases.billDate": "ວັນທີໃບບິນ",
    "purchases.unitCost": "ຕົ້ນທຶນຕໍ່ໜ່ວຍ",
    "purchases.saveBill": "ບັນທຶກໃບບິນ",
    "purchases.bills": "ໃບບິນຊື້",
    "purchases.billCount": ({ count }) => `${count} ໃບບິນ`,
    "purchases.bill": "ໃບບິນ",
    "purchases.unknownVendor": "ບໍ່ຮູ້ຜູ້ຂາຍ",
    "purchases.noBills": "ບໍ່ມີໃບບິນຊື້",
    "purchases.vendors": "ຜູ້ຂາຍ",
    "purchases.vendorCount": ({ count }) => `${count} ໂປຣໄຟລ໌ຜູ້ຂາຍ`,
    "purchases.noVendors": "ບໍ່ມີຜູ້ຂາຍ",
    "purchases.vendorRequired": "ຕ້ອງມີຊື່ຜູ້ຂາຍ.",
    "purchases.vendorSaved": "ບັນທຶກຜູ້ຂາຍແລ້ວ.",
    "purchases.vendorSaveError": "ບໍ່ສາມາດບັນທຶກຜູ້ຂາຍໄດ້.",
    "purchases.billRequired": "ຕ້ອງມີເລກໃບບິນ ແລະ ຜູ້ຂາຍ.",
    "purchases.billDatesInvalid": "ວັນທີໃບບິນບໍ່ຖືກຕ້ອງ.",
    "purchases.billLinesInvalid": "ແຕ່ລະແຖວຕ້ອງມີບັນຊີ, ລາຍລະອຽດ, ຈຳນວນບວກ, ແລະ ຕົ້ນທຶນບໍ່ຕິດລົບ.",
    "purchases.billSubtotalInvalid": "ລວມຍ່ອຍຂອງໃບບິນຕ້ອງຫຼາຍກວ່າສູນ.",
    "purchases.billSaved": "ບັນທຶກໃບບິນເປັນຮ່າງແລ້ວ.",
    "purchases.billSaveError": "ບໍ່ສາມາດບັນທຶກໃບບິນໄດ້.",
    "purchases.billPosted": ({ entryNo }) => `ໂພສໃບບິນໄປທີ່ ${entryNo}.`,
    "purchases.billPostError": "ບໍ່ສາມາດໂພສໃບບິນໄດ້.",
    "accounts.editAccount": "ແກ້ໄຂບັນຊີ",
    "accounts.addAccount": "ເພີ່ມບັນຊີ",
    "accounts.help": "ຈັດການຜັງບັນຊີຂອງບໍລິສັດ.",
    "accounts.readOnly": "ບົດບາດຂອງທ່ານອ່ານບັນຊີໄດ້ເທົ່ານັ້ນ.",
    "accounts.type": "ປະເພດ",
    "accounts.normalSide": "ດ້ານປົກກະຕິ",
    "accounts.openingDebit": "ເດບິດເປີດຕົ້ນ",
    "accounts.openingCredit": "ເຄຣດິດເປີດຕົ້ນ",
    "accounts.saveAccount": "ບັນທຶກບັນຊີ",
    "accounts.count": ({ count }) => `${count} ບັນຊີ`,
    "accounts.required": "ຕ້ອງມີລະຫັດບັນຊີ ແລະ ຊື່.",
    "accounts.saved": "ບັນທຶກບັນຊີແລ້ວ.",
    "accounts.saveError": "ບໍ່ສາມາດບັນທຶກບັນຊີໄດ້.",
    "accounts.deleteAccount": "ລຶບບັນຊີ",
    "accounts.deleted": "ລຶບບັນຊີແລ້ວ.",
    "accounts.deleteError": "ບໍ່ສາມາດລຶບບັນຊີໄດ້. ບັນຊີທີ່ມີລາຍການຖືກປົກປ້ອງ.",
    "trial.subtitle": "ຄຳນວນເດບິດ ແລະ ເຄຣດິດຈາກລາຍການທີ່ໂພສແລ້ວ",
    "trial.difference": ({ amount }) => `ສ່ວນຕ່າງ ${amount}`,
    "trial.group": "ກຸ່ມ",
    "reports.subtitle": "ລາຍງານທີ່ພ້ອມໃຊ້ມາຈາກລາຍການບັນຊີປັດຈຸບັນ.",
    "reports.closeReadiness": "ຄວາມພ້ອມປິດງວດ",
    "reports.totalDebits": "ເດບິດລວມ",
    "reports.totalCredits": "ເຄຣດິດລວມ",
    "reports.netProfit": "ກຳໄລສຸດທິ",
    "report.profitLoss": "ກຳໄລ ແລະ ຂາດທຶນ",
    "report.balanceSheet": "ງົບດຸນ",
    "report.trialBalance": "ດຸນທົດລອງ",
    "report.cashFlow": "ງົບກະແສເງິນສົດ",
    "report.pendingClose": "ລໍຖ້າປິດງວດ",
    "team.addMember": "ເພີ່ມສະມາຊິກທີມ",
    "team.help": "ສ້າງຄຳເຊີນທີ່ລໍຖ້າສຳລັບເພື່ອນຮ່ວມທີມ.",
    "team.readOnly": "ມີແຕ່ເຈົ້າຂອງ ແລະ ຜູ້ດູແລທີ່ຈັດການທີມໄດ້.",
    "team.createInvitation": "ສ້າງຄຳເຊີນ",
    "team.pendingInvitations": "ຄຳເຊີນທີ່ລໍຖ້າ",
    "team.openInvites": ({ count }) => `${count} ຄຳເຊີນເປີດ`,
    "team.noPendingInvitations": "ບໍ່ມີຄຳເຊີນທີ່ລໍຖ້າ",
    "team.companyTeam": ({ company }) => `ທີມ ${company}`,
    "team.memberCount": ({ count }) => `${count} ສະມາຊິກ`,
    "team.noMembers": "ບໍ່ມີສະມາຊິກທີມ",
    "team.removeMember": "ລຶບສະມາຊິກ",
    "team.emailRequired": "ຕ້ອງມີອີເມວ.",
    "team.invitationSaved": "ບັນທຶກຄຳເຊີນແລ້ວ.",
    "team.addError": "ບໍ່ສາມາດເພີ່ມສະມາຊິກທີມໄດ້.",
    "team.roleUpdated": "ອັບເດດບົດບາດແລ້ວ.",
    "team.roleUpdateError": "ບໍ່ສາມາດອັບເດດບົດບາດໄດ້.",
    "team.memberRemoved": "ລຶບສະມາຊິກທີມແລ້ວ.",
    "team.memberRemoveError": "ບໍ່ສາມາດລຶບສະມາຊິກທີມໄດ້.",
    "audit.title": "ປະຫວັດກວດສອບ",
    "audit.subtitle": "ການປ່ຽນແປງຫຼ້າສຸດຂອງບໍລິສັດທີ່ຖືກບັນທຶກໂດຍທຣິກເກີຖານຂໍ້ມູນ.",
    "audit.time": "ເວລາ",
    "audit.actor": "ຜູ້ດຳເນີນການ",
    "audit.action": "ການກະທຳ",
    "audit.entity": "ປະເພດຂໍ້ມູນ",
    "audit.record": "ລະຫັດລາຍການ",
    "audit.empty": "ຍັງບໍ່ມີປະຫວັດກວດສອບ",
    "settings.appearance": "ຮູບລັກສະນະ",
    "settings.appearanceSubtitle": "ການຕັ້ງຄ່າຈະຢູ່ໃນເບຣາວເຊີນີ້.",
    "settings.language": "ພາສາ",
    "settings.languageHelp": "ສະຫຼັບປ້າຍຊື່ພື້ນທີ່ວຽກລະຫວ່າງພາສາອັງກິດ ແລະ ພາສາລາວ.",
    "settings.darkMode": "ໂໝດມືດ",
    "settings.darkModeHelp": "ໃຊ້ສີພື້ນທີ່ວຽກແບບມືດ.",
    "settings.compactLayout": "ຮູບແບບກະທັດຮັດ",
    "settings.compactLayoutHelp": "ຫຼຸດຊ່ອງວ່າງສຳລັບຕາຕະລາງ ແລະ ແຜງ.",
    "settings.largerText": "ຕົວອັກສອນໃຫຍ່ຂຶ້ນ",
    "settings.largerTextHelp": "ເພີ່ມຂະໜາດຕົວອັກສອນເພື່ອອ່ານງ່າຍ.",
    "settings.workspace": "ພື້ນທີ່ວຽກ",
    "settings.workspaceSubtitle": "ບໍລິບົດທີ່ເຂົ້າສູ່ລະບົບຢູ່.",
    "status.posted": "ໂພສແລ້ວ",
    "status.review": "ລໍກວດ",
    "status.draft": "ຮ່າງ",
    "status.void": "ຍົກເລີກ",
    "status.sent": "ສົ່ງແລ້ວ",
    "status.paid": "ຈ່າຍແລ້ວ",
    "status.approved": "ອະນຸມັດແລ້ວ",
    "status.active": "ໃຊ້ງານ",
    "status.inactive": "ບໍ່ໃຊ້ງານ",
    "status.pending": "ລໍຖ້າ",
    "status.accepted": "ຮັບແລ້ວ",
    "status.revoked": "ຖອນແລ້ວ",
    "role.owner": "ເຈົ້າຂອງ",
    "role.admin": "ຜູ້ດູແລ",
    "role.accountant": "ນັກບັນຊີ",
    "role.reviewer": "ຜູ້ກວດສອບ",
    "role.viewer": "ຜູ້ເບິ່ງ",
    "role.member": "ສະມາຊິກ",
    "accountType.Asset": "ຊັບສິນ",
    "accountType.Liability": "ໜີ້ສິນ",
    "accountType.Equity": "ທຶນ",
    "accountType.Revenue": "ລາຍຮັບ",
    "accountType.Expense": "ຄ່າໃຊ້ຈ່າຍ",
    "accountGroup.Assets": "ຊັບສິນ",
    "accountGroup.Liabilities": "ໜີ້ສິນ",
    "accountGroup.Equity": "ທຶນ",
    "accountGroup.Revenue": "ລາຍຮັບ",
    "accountGroup.Expenses": "ຄ່າໃຊ້ຈ່າຍ",
    "side.debit": "ເດບິດ",
    "side.credit": "ເຄຣດິດ",
  },
};

function createTranslator(language) {
  const dictionary = translations[language] ?? translations.en;
  return (key, variables = {}) => {
    const value = dictionary[key] ?? translations.en[key] ?? key;
    return typeof value === "function" ? value(variables) : value;
  };
}

const defaultTranslator = createTranslator("en");
const I18nContext = createContext({ language: "en", t: defaultTranslator });

function useTranslation() {
  return useContext(I18nContext);
}

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

function roleLabel(role, t = defaultTranslator) {
  if (!role) return t("role.member");
  return t(`role.${role}`);
}

function statusLabel(status, t = defaultTranslator) {
  return t(`status.${status}`);
}

function accountTypeLabel(type, t = defaultTranslator) {
  return t(`accountType.${type}`);
}

function sideLabel(side, t = defaultTranslator) {
  return t(`side.${side}`);
}

function accountGroupLabel(group, t = defaultTranslator) {
  return t(`accountGroup.${group}`);
}

function accountDisplayName(account, language) {
  if (language === "lo" && account.nameLao) return account.nameLao;
  return account.nameEn;
}

function canManageTeam(role) {
  return ["owner", "admin"].includes(role);
}

function canManageAccounting(role) {
  return ["owner", "admin", "accountant"].includes(role);
}

function LoginGate({ authEmail, authPassword, authStatus, setAuthEmail, setAuthPassword, onSignIn, onSignUp }) {
  const { t } = useTranslation();

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="login-mark">
            <Landmark size={34} />
          </div>
          <h1>{t("app.name")}</h1>
          <p>{t("auth.subtitle")}</p>
        </div>
        <form className="login-form" onSubmit={onSignIn}>
          <label>
            {t("common.email")}
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
            {t("common.password")}
            <input
              type="password"
              autoComplete="current-password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              placeholder={t("common.password")}
              minLength={6}
              required
            />
          </label>
          <button className="primary-button wide" type="submit">
            {t("auth.signIn")}
          </button>
          <button className="secondary-button wide" type="button" onClick={onSignUp}>
            {t("auth.createAccount")}
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
  const { language, t } = useTranslation();

  return (
    <main className="login-page">
      <section className="login-panel onboarding-panel">
        <div className="login-brand">
          <div className="login-mark">
            <Building2 size={32} />
          </div>
          <div>
            <h1>{t("onboarding.title")}</h1>
            <p>{t("onboarding.subtitle")}</p>
          </div>
        </div>

        <div className="login-form">
          <label>
            {t("onboarding.companyName")}
            <input value={companyNameDraft} onChange={(event) => setCompanyNameDraft(event.target.value)} placeholder="Rabbitwork Company" />
          </label>
          <button className="primary-button wide" onClick={onCreateCompany} disabled={isSaving || !companyNameDraft.trim()}>
            {t("onboarding.createCompany")}
          </button>
        </div>

        <div className="onboarding-divider">{t("onboarding.pendingInvitations")}</div>
        <div className="summary-list">
          {invitations.length ? (
            invitations.map((invitation) => (
              <div className="summary-row" key={invitation.id}>
                <span>{invitation.companyName || invitation.companyId}</span>
                <strong>{roleLabel(invitation.role, t)}</strong>
                <button className="secondary-button" onClick={() => onAcceptInvitation(invitation)} disabled={isSaving}>
                  {t("onboarding.accept")}
                </button>
              </div>
            ))
          ) : (
            <p className="empty-state">{t("onboarding.noPendingInvitations")}</p>
          )}
        </div>

        {status && <p className="auth-message">{status}</p>}
        <button className="text-button" onClick={onSignOut}>{t("common.signOut")}</button>
      </section>
    </main>
  );
}

function DashboardPage({ totals, reviewEntries, recentEntries, reports, setActivePage }) {
  const { t } = useTranslation();
  const kpis = [
    { label: t("dashboard.assets"), value: totals.assets, tone: "teal", icon: WalletCards },
    { label: t("dashboard.liabilities"), value: totals.liabilities, tone: "amber", icon: Landmark },
    { label: t("dashboard.equity"), value: totals.equity, tone: "indigo", icon: Building2 },
    { label: t("dashboard.profit"), value: totals.profit, tone: "green", icon: BarChart3 },
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
            <h2>{t("dashboard.trialStatus")}</h2>
            <p>{t("period.may2025")}</p>
          </div>
          <StatusPill tone={totals.difference < 0.005 ? "success" : "warning"}>
            {totals.difference < 0.005 ? t("dashboard.balanced") : t("dashboard.needsReview")}
          </StatusPill>
        </div>
        <dl className="summary-list">
          <div>
            <dt>{t("dashboard.totalDebits")}</dt>
            <dd>{money(totals.debits)}</dd>
          </div>
          <div>
            <dt>{t("dashboard.totalCredits")}</dt>
            <dd>{money(totals.credits)}</dd>
          </div>
          <div>
            <dt>{t("dashboard.netDifference")}</dt>
            <dd>{money(totals.difference)}</dd>
          </div>
        </dl>
      </section>

      <section className="panel review-panel">
        <div className="panel-head">
          <div>
            <h2>{t("dashboard.reviewQueue")}</h2>
            <p>{t("dashboard.entriesNeedAttention", { count: reviewEntries.length })}</p>
          </div>
          <button className="primary-button" onClick={() => setActivePage("journal")}>
            <Plus size={17} />
            {t("dashboard.postEntry")}
          </button>
        </div>
        <DataTable
          columns={[t("journal.entryNo"), t("common.date"), t("common.description"), t("common.status"), t("common.amount")]}
          rows={reviewEntries.slice(0, 5).map((entry) => {
            const totalsForEntry = entryTotals(entry);
            return [
              entry.id,
              entry.date,
              entry.description || t("journal.missingDescription"),
              <StatusPill tone="warning" key="status">{t("dashboard.needsReview")}</StatusPill>,
              money(Math.max(totalsForEntry.debit, totalsForEntry.credit)),
            ];
          })}
          empty={t("dashboard.noReviewItems")}
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("dashboard.recentEntries")}</h2>
            <p>{t("dashboard.latestActivity")}</p>
          </div>
          <button className="text-button" onClick={() => setActivePage("journal")}>
            {t("dashboard.viewAll")} <ArrowRight size={15} />
          </button>
        </div>
        <DataTable
          columns={[t("journal.entryNo"), t("common.date"), t("common.description"), t("common.status")]}
          rows={recentEntries.slice(0, 5).map((entry) => [
            entry.id,
            entry.date,
            entry.description || t("journal.missingDescription"),
            <StatusPill tone={entry.status === "posted" ? "success" : "warning"} key="status">
              {statusLabel(entry.status, t)}
            </StatusPill>,
          ])}
          empty={t("dashboard.noJournalEntries")}
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("page.reports")}</h2>
            <p>{t("dashboard.reportsSubtitle")}</p>
          </div>
          <button className="text-button" onClick={() => setActivePage("reports")}>
            {t("dashboard.viewAll")} <ArrowRight size={15} />
          </button>
        </div>
        <DataTable
          columns={[t("common.report"), t("common.period"), t("common.status")]}
          rows={reports.map((report) => [
            report.name,
            report.period,
            <StatusPill tone={report.status === t("common.ready") ? "success" : "neutral"} key={report.name}>
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
  const { language, t } = useTranslation();

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-grid journal-grid">
      <section className="panel journal-form-panel">
        <div className="panel-head">
          <div>
            <h2>{editingEntryId ? t("journal.editEntry") : t("journal.postEntry")}</h2>
            <p>{canEdit ? t("journal.savedToSupabase") : t("journal.readOnly")}</p>
          </div>
          <StatusPill tone={draftAnalysis.canPost ? "success" : "warning"}>
            {draftAnalysis.canPost ? t("common.ready") : t("dashboard.needsReview")}
          </StatusPill>
        </div>
        <div className="entry-form">
          <label>
            {t("common.date")}
            <input value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} type="date" disabled={!canEdit} />
          </label>
          <label>
            {t("common.reference")}
            <input value={draft.reference} onChange={(event) => updateDraft("reference", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("common.description")}
            <input value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("journal.debitAccount")}
            <select value={draft.debitAccount} onChange={(event) => updateDraft("debitAccount", event.target.value)} disabled={!canEdit}>
              {accounts.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} {accountDisplayName(account, language)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("journal.debitAmount")}
            <input type="number" value={draft.debit} min="0" onChange={(event) => updateDraft("debit", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("journal.creditAccount")}
            <select value={draft.creditAccount} onChange={(event) => updateDraft("creditAccount", event.target.value)} disabled={!canEdit}>
              {accounts.map((account) => (
                <option key={account.code} value={account.code}>
                  {account.code} {accountDisplayName(account, language)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("journal.creditAmount")}
            <input type="number" value={draft.credit} min="0" onChange={(event) => updateDraft("credit", event.target.value)} disabled={!canEdit} />
          </label>
        </div>
        <div className={draftAnalysis.canPost ? "validation success" : "validation warning"}>
          {draftAnalysis.canPost ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>
            {t("journal.validation", {
              debit: money(draftAnalysis.debit),
              credit: money(draftAnalysis.credit),
              difference: money(draftAnalysis.difference),
            })}
          </span>
        </div>
        <div className="form-actions">
          {editingEntryId && (
            <button className="secondary-button" onClick={cancelEdit} disabled={isSaving}>
              {t("journal.cancelEdit")}
            </button>
          )}
          <button className="secondary-button" onClick={saveDraft} disabled={!canEdit || isSaving}>
            {t("journal.saveForReview")}
          </button>
          <button className="primary-button" onClick={postDraft} disabled={!canEdit || !draftAnalysis.canPost || isSaving}>
            {isSaving ? t("common.saving") : t("journal.postEntry")}
          </button>
        </div>
      </section>

      <section className="panel journal-table-panel">
        <div className="panel-head">
          <div>
            <h2>{t("journal.register")}</h2>
            <p>{t("journal.entries", { count: entries.length })}</p>
          </div>
        </div>
        <DataTable
          columns={[t("journal.entryNo"), t("common.date"), t("common.description"), t("common.debit"), t("common.credit"), t("common.status"), t("common.actions")]}
          rows={entries.map((entry) => {
            const totals = analyzeEntry(entry, accountsByCode);
            return [
              entry.id,
              entry.date,
              entry.description || t("journal.missingDescription"),
              money(totals.debit),
              money(totals.credit),
              <StatusPill tone={entry.status === "posted" ? "success" : "warning"} key={entry.id}>
                {statusLabel(entry.status, t)}
              </StatusPill>,
              <span className="table-actions" key={`${entry.id}-actions`}>
                <button className="text-button icon-button" onClick={() => startEditEntry(entry)} disabled={!canEdit || entry.status === "void"} title={t("journal.editTitle")}>
                  <Pencil size={15} />
                </button>
                <button className="text-button icon-button danger" onClick={() => voidEntry(entry)} disabled={!canEdit || entry.status === "void"} title={t("journal.voidTitle")}>
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
  const { t } = useTranslation();

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
            <h2>{t("sales.addCustomer")}</h2>
            <p>{canEdit ? t("sales.customerHelp") : t("sales.customerReadOnly")}</p>
          </div>
        </div>
        <div className="entry-form">
          <label className="span-2">
            {t("sales.customerName")}
            <input value={customerDraft.name} onChange={(event) => updateCustomer("name", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("common.email")}
            <input type="email" value={customerDraft.email} onChange={(event) => updateCustomer("email", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("common.phone")}
            <input value={customerDraft.phone} onChange={(event) => updateCustomer("phone", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("sales.billingAddress")}
            <textarea value={customerDraft.billingAddress} onChange={(event) => updateCustomer("billingAddress", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("common.status")}
            <select value={customerDraft.status} onChange={(event) => updateCustomer("status", event.target.value)} disabled={!canEdit}>
              <option value="active">{t("status.active")}</option>
              <option value="inactive">{t("status.inactive")}</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" onClick={saveCustomerDraft} disabled={!canEdit || isSaving}>
            {t("sales.saveCustomer")}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("sales.draftInvoice")}</h2>
            <p>{t("sales.invoiceHelp")}</p>
          </div>
          <StatusPill tone={subtotal > 0 ? "success" : "warning"}>{money(total)}</StatusPill>
        </div>
        <div className="entry-form">
          <label>
            {t("sales.invoiceNumber")}
            <input value={invoiceDraft.invoiceNo} onChange={(event) => updateInvoice("invoiceNo", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("sales.customer")}
            <select value={invoiceDraft.customerId} onChange={(event) => updateInvoice("customerId", event.target.value)} disabled={!canEdit || !customers.length}>
              <option value="">{t("sales.selectCustomer")}</option>
              {customers
                .filter((customer) => customer.status === "active")
                .map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
            </select>
          </label>
          <label>
            {t("sales.issueDate")}
            <input type="date" value={invoiceDraft.issueDate} onChange={(event) => updateInvoice("issueDate", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("sales.dueDate")}
            <input type="date" value={invoiceDraft.dueDate} onChange={(event) => updateInvoice("dueDate", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("sales.taxAmount")}
            <input type="number" min="0" value={invoiceDraft.taxAmount} onChange={(event) => updateInvoice("taxAmount", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("common.notes")}
            <textarea value={invoiceDraft.notes} onChange={(event) => updateInvoice("notes", event.target.value)} disabled={!canEdit} />
          </label>
        </div>

        <div className="line-items">
          {invoiceDraft.items.map((item, index) => (
            <div className="invoice-line-grid" key={index}>
              <label>
                {t("sales.description")}
                <input value={item.description} onChange={(event) => updateInvoiceItem(index, "description", event.target.value)} disabled={!canEdit} />
              </label>
              <label>
                {t("sales.quantity")}
                <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateInvoiceItem(index, "quantity", event.target.value)} disabled={!canEdit} />
              </label>
              <label>
                {t("sales.unitPrice")}
                <input type="number" min="0" value={item.unitPrice} onChange={(event) => updateInvoiceItem(index, "unitPrice", event.target.value)} disabled={!canEdit} />
              </label>
              <div className="line-total">
                <span>{t("sales.lineTotal")}</span>
                <strong>{money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}</strong>
              </div>
              <button className="text-button icon-button danger" onClick={() => removeInvoiceLine(index)} disabled={!canEdit || invoiceDraft.items.length === 1} title={t("sales.removeLine")}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="sales-totals">
          <span>{t("common.subtotal")} {money(subtotal)}</span>
          <strong>{t("common.total")} {money(total)}</strong>
        </div>

        {salesStatus && <p className="notice">{salesStatus}</p>}
        <div className="form-actions">
          <button className="secondary-button" onClick={addInvoiceLine} disabled={!canEdit || isSaving}>
            <Plus size={17} />
            {t("sales.addLine")}
          </button>
          <button className="primary-button" onClick={saveInvoiceDraft} disabled={!canEdit || isSaving || !customers.length}>
            {t("sales.saveInvoice")}
          </button>
        </div>
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>{t("sales.invoices")}</h2>
            <p>{t("sales.invoiceCount", { count: invoices.length })}</p>
          </div>
        </div>
        <DataTable
          columns={[t("sales.invoice"), t("sales.customer"), t("common.total"), t("common.status"), t("common.actions"), t("common.issue"), t("common.due"), t("common.ledger")]}
          rows={invoices.map((invoice) => [
            invoice.invoiceNo,
            invoice.customerName || t("sales.unknownCustomer"),
            money(invoice.totalAmount),
            <StatusPill tone={invoiceStatusTone(invoice.status)} key={`${invoice.id}-status`}>{statusLabel(invoice.status, t)}</StatusPill>,
            <span className="table-actions" key={`${invoice.id}-actions`}>
              <button className="text-button" onClick={() => postInvoiceDraft(invoice)} disabled={!canEdit || isSaving || invoice.status !== "draft"}>
                {t("sales.post")}
              </button>
            </span>,
            invoice.issueDate,
            invoice.dueDate,
            invoice.postedEntryNo || t("sales.notPosted"),
          ])}
          empty={t("sales.noInvoices")}
        />
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>{t("sales.customers")}</h2>
            <p>{t("sales.customerCount", { count: customers.length })}</p>
          </div>
        </div>
        <DataTable
          columns={[t("common.name"), t("common.email"), t("common.phone"), t("common.status")]}
          rows={customers.map((customer) => [
            customer.name,
            customer.email || t("sales.noEmail"),
            customer.phone || t("sales.noPhone"),
            <StatusPill tone={customer.status === "active" ? "success" : "neutral"} key={customer.id}>{statusLabel(customer.status, t)}</StatusPill>,
          ])}
          empty={t("sales.noCustomers")}
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
  const { language, t } = useTranslation();
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
            <h2>{t("purchases.addVendor")}</h2>
            <p>{canEdit ? t("purchases.vendorHelp") : t("purchases.vendorReadOnly")}</p>
          </div>
        </div>
        <div className="entry-form">
          <label className="span-2">
            {t("purchases.vendorName")}
            <input value={vendorDraft.name} onChange={(event) => updateVendor("name", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("common.email")}
            <input type="email" value={vendorDraft.email} onChange={(event) => updateVendor("email", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("common.phone")}
            <input value={vendorDraft.phone} onChange={(event) => updateVendor("phone", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("purchases.taxId")}
            <input value={vendorDraft.taxId} onChange={(event) => updateVendor("taxId", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("sales.billingAddress")}
            <textarea value={vendorDraft.billingAddress} onChange={(event) => updateVendor("billingAddress", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("common.status")}
            <select value={vendorDraft.status} onChange={(event) => updateVendor("status", event.target.value)} disabled={!canEdit}>
              <option value="active">{t("status.active")}</option>
              <option value="inactive">{t("status.inactive")}</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="primary-button" onClick={saveVendorDraft} disabled={!canEdit || isSaving}>
            {t("purchases.saveVendor")}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("purchases.draftBill")}</h2>
            <p>{t("purchases.billHelp")}</p>
          </div>
          <StatusPill tone={subtotal > 0 ? "success" : "warning"}>{money(total)}</StatusPill>
        </div>
        <div className="entry-form">
          <label>
            {t("purchases.billNumber")}
            <input value={billDraft.billNo} onChange={(event) => updateBill("billNo", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("purchases.vendor")}
            <select value={billDraft.vendorId} onChange={(event) => updateBill("vendorId", event.target.value)} disabled={!canEdit || !vendors.length}>
              <option value="">{t("purchases.selectVendor")}</option>
              {vendors
                .filter((vendor) => vendor.status === "active")
                .map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
            </select>
          </label>
          <label>
            {t("purchases.billDate")}
            <input type="date" value={billDraft.billDate} onChange={(event) => updateBill("billDate", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("sales.dueDate")}
            <input type="date" value={billDraft.dueDate} onChange={(event) => updateBill("dueDate", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("sales.taxAmount")}
            <input type="number" min="0" value={billDraft.taxAmount} onChange={(event) => updateBill("taxAmount", event.target.value)} disabled={!canEdit} />
          </label>
          <label className="span-2">
            {t("common.notes")}
            <textarea value={billDraft.notes} onChange={(event) => updateBill("notes", event.target.value)} disabled={!canEdit} />
          </label>
        </div>

        <div className="line-items">
          {billDraft.items.map((item, index) => (
            <div className="invoice-line-grid purchase-line-grid" key={index}>
              <label>
                {t("common.account")}
                <select value={item.accountCode} onChange={(event) => updateBillItem(index, "accountCode", event.target.value)} disabled={!canEdit}>
                  {purchaseAccounts.map((account) => (
                    <option key={account.code} value={account.code}>{account.code} {accountDisplayName(account, language)}</option>
                  ))}
                </select>
              </label>
              <label>
                {t("common.description")}
                <input value={item.description} onChange={(event) => updateBillItem(index, "description", event.target.value)} disabled={!canEdit} />
              </label>
              <label>
                {t("sales.quantity")}
                <input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateBillItem(index, "quantity", event.target.value)} disabled={!canEdit} />
              </label>
              <label>
                {t("purchases.unitCost")}
                <input type="number" min="0" value={item.unitCost} onChange={(event) => updateBillItem(index, "unitCost", event.target.value)} disabled={!canEdit} />
              </label>
              <div className="line-total">
                <span>{t("sales.lineTotal")}</span>
                <strong>{money((Number(item.quantity) || 0) * (Number(item.unitCost) || 0))}</strong>
              </div>
              <button className="text-button icon-button danger" onClick={() => removeBillLine(index)} disabled={!canEdit || billDraft.items.length === 1} title={t("sales.removeLine")}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="sales-totals">
          <span>{t("common.subtotal")} {money(subtotal)}</span>
          <strong>{t("common.total")} {money(total)}</strong>
        </div>

        {purchaseStatus && <p className="notice">{purchaseStatus}</p>}
        <div className="form-actions">
          <button className="secondary-button" onClick={addBillLine} disabled={!canEdit || isSaving}>
            <Plus size={17} />
            {t("sales.addLine")}
          </button>
          <button className="primary-button" onClick={saveBillDraft} disabled={!canEdit || isSaving || !vendors.length || !purchaseAccounts.length}>
            {t("purchases.saveBill")}
          </button>
        </div>
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>{t("purchases.bills")}</h2>
            <p>{t("purchases.billCount", { count: bills.length })}</p>
          </div>
        </div>
        <DataTable
          columns={[t("purchases.bill"), t("purchases.vendor"), t("common.total"), t("common.status"), t("common.actions"), t("purchases.billDate"), t("common.due"), t("common.ledger")]}
          rows={bills.map((bill) => [
            bill.billNo,
            bill.vendorName || t("purchases.unknownVendor"),
            money(bill.totalAmount),
            <StatusPill tone={billStatusTone(bill.status)} key={`${bill.id}-status`}>{statusLabel(bill.status, t)}</StatusPill>,
            <span className="table-actions" key={`${bill.id}-actions`}>
              <button className="text-button" onClick={() => postBillDraft(bill)} disabled={!canEdit || isSaving || bill.status !== "draft"}>
                {t("sales.post")}
              </button>
            </span>,
            bill.billDate,
            bill.dueDate,
            bill.postedEntryNo || t("sales.notPosted"),
          ])}
          empty={t("purchases.noBills")}
        />
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>{t("purchases.vendors")}</h2>
            <p>{t("purchases.vendorCount", { count: vendors.length })}</p>
          </div>
        </div>
        <DataTable
          columns={[t("common.name"), t("common.email"), t("common.phone"), t("common.status")]}
          rows={vendors.map((vendor) => [
            vendor.name,
            vendor.email || t("sales.noEmail"),
            vendor.phone || t("sales.noPhone"),
            <StatusPill tone={vendor.status === "active" ? "success" : "neutral"} key={vendor.id}>{statusLabel(vendor.status, t)}</StatusPill>,
          ])}
          empty={t("purchases.noVendors")}
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
  const { t } = useTranslation();

  function updateAccount(field, value) {
    setAccountDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-grid management-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{editingAccountCode ? t("accounts.editAccount") : t("accounts.addAccount")}</h2>
            <p>{canEdit ? t("accounts.help") : t("accounts.readOnly")}</p>
          </div>
        </div>
        <div className="entry-form">
          <label>
            {t("common.code")}
            <input value={accountDraft.code} onChange={(event) => updateAccount("code", event.target.value)} disabled={!canEdit || !!editingAccountCode} />
          </label>
          <label>
            {t("common.name")}
            <input value={accountDraft.nameEn} onChange={(event) => updateAccount("nameEn", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("accounts.type")}
            <select value={accountDraft.type} onChange={(event) => updateAccount("type", event.target.value)} disabled={!canEdit}>
              {accountTypes.map((type) => (
                <option key={type} value={type}>{accountTypeLabel(type, t)}</option>
              ))}
            </select>
          </label>
          <label>
            {t("accounts.normalSide")}
            <select value={accountDraft.normalSide} onChange={(event) => updateAccount("normalSide", event.target.value)} disabled={!canEdit}>
              {normalSides.map((side) => (
                <option key={side} value={side}>{sideLabel(side, t)}</option>
              ))}
            </select>
          </label>
          <label>
            {t("accounts.openingDebit")}
            <input type="number" min="0" value={accountDraft.openingDebit} onChange={(event) => updateAccount("openingDebit", event.target.value)} disabled={!canEdit} />
          </label>
          <label>
            {t("accounts.openingCredit")}
            <input type="number" min="0" value={accountDraft.openingCredit} onChange={(event) => updateAccount("openingCredit", event.target.value)} disabled={!canEdit} />
          </label>
        </div>
        {accountStatus && <p className="notice">{accountStatus}</p>}
        <div className="form-actions">
          {editingAccountCode && (
            <button className="secondary-button" onClick={cancelAccountEdit} disabled={isSaving}>
              {t("journal.cancelEdit")}
            </button>
          )}
          <button className="primary-button" onClick={saveAccountDraft} disabled={!canEdit || isSaving}>
            {t("accounts.saveAccount")}
          </button>
        </div>
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>{t("page.accounts")}</h2>
            <p>{t("accounts.count", { count: accountRows.length })}</p>
          </div>
        </div>
        <DataTable
          columns={[t("common.code"), t("common.account"), t("accounts.type"), t("accounts.normalSide"), t("common.debit"), t("common.credit"), t("common.balance"), t("common.actions")]}
          rows={accountRows.map((account) => [
            account.code,
            accountDisplayName(account, language),
            accountTypeLabel(account.type, t),
            sideLabel(account.normalSide, t),
            money(account.netDebit),
            money(account.netCredit),
            money(account.balance),
            <span className="table-actions" key={`${account.code}-actions`}>
              <button className="text-button icon-button" onClick={() => startEditAccount(account)} disabled={!canEdit} title={t("accounts.editAccount")}>
                <Pencil size={15} />
              </button>
              <button className="text-button icon-button danger" onClick={() => deleteAccountRow(account)} disabled={!canEdit} title={t("accounts.deleteAccount")}>
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
  const { t } = useTranslation();

  return (
    <section className="panel full-page-panel">
      <div className="panel-head">
        <div>
          <h2>{t("page.trial")}</h2>
          <p>{t("trial.subtitle")}</p>
        </div>
        <StatusPill tone={totals.difference < 0.005 ? "success" : "warning"}>
          {t("trial.difference", { amount: money(totals.difference) })}
        </StatusPill>
      </div>
      <DataTable
        columns={[t("trial.group"), t("common.debit"), t("common.credit")]}
        rows={trialRows.map((row) => [accountGroupLabel(row.label, t), money(row.debit), money(row.credit)])}
      />
    </section>
  );
}

function ReportsPage({ reports, totals }) {
  const { t } = useTranslation();

  return (
    <div className="page-grid reports-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("page.reports")}</h2>
            <p>{t("reports.subtitle")}</p>
          </div>
        </div>
        <DataTable
          columns={[t("common.report"), t("common.period"), t("common.status"), t("common.value")]}
          rows={reports.map((report) => [
            report.name,
            report.period,
            <StatusPill tone={report.status === t("common.ready") ? "success" : "neutral"} key={report.name}>
              {report.status}
            </StatusPill>,
            report.value,
          ])}
        />
      </section>
      <section className="panel report-notes">
        <h2>{t("reports.closeReadiness")}</h2>
        <dl className="summary-list">
          <div>
            <dt>{t("reports.totalDebits")}</dt>
            <dd>{money(totals.debits)}</dd>
          </div>
          <div>
            <dt>{t("reports.totalCredits")}</dt>
            <dd>{money(totals.credits)}</dd>
          </div>
          <div>
            <dt>{t("reports.netProfit")}</dt>
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
  const { t } = useTranslation();

  function updateInvite(field, value) {
    setInviteDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-grid management-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("team.addMember")}</h2>
            <p>{canEdit ? t("team.help") : t("team.readOnly")}</p>
          </div>
          <StatusPill tone={canEdit ? "success" : "neutral"}>{canEdit ? t("common.adminAccess") : t("common.readOnly")}</StatusPill>
        </div>
        <div className="entry-form">
          <label className="span-2">
            {t("common.email")}
            <input
              type="email"
              value={inviteDraft.email}
              onChange={(event) => updateInvite("email", event.target.value)}
              disabled={!canEdit}
              placeholder="teammate@company.com"
            />
          </label>
          <label className="span-2">
            {t("common.role")}
            <select value={inviteDraft.role} onChange={(event) => updateInvite("role", event.target.value)} disabled={!canEdit}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>{roleLabel(role, t)}</option>
              ))}
            </select>
          </label>
        </div>
        {teamStatus && <p className="notice">{teamStatus}</p>}
        <div className="form-actions">
          <button className="primary-button" onClick={addMember} disabled={!canEdit || isSaving}>
            <UserPlus size={17} />
            {t("team.createInvitation")}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("team.pendingInvitations")}</h2>
            <p>{t("team.openInvites", { count: invitations.length })}</p>
          </div>
        </div>
        <DataTable
          columns={[t("common.email"), t("common.role"), t("common.status")]}
          rows={invitations.map((invitation) => [
            invitation.email,
            roleLabel(invitation.role, t),
            <StatusPill tone="neutral" key={invitation.id}>{statusLabel(invitation.status, t)}</StatusPill>,
          ])}
          empty={t("team.noPendingInvitations")}
        />
      </section>

      <section className="panel full-page-panel">
        <div className="panel-head">
          <div>
            <h2>{t("team.companyTeam", { company: company?.name ?? t("common.company") })}</h2>
            <p>{t("team.memberCount", { count: teamMembers.length })}</p>
          </div>
        </div>
        <DataTable
          columns={[t("common.name"), t("common.email"), t("common.role"), t("common.actions")]}
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
                <option key={role} value={role}>{roleLabel(role, t)}</option>
              ))}
            </select>,
            <span className="table-actions" key={`${member.id}-actions`}>
              <button className="text-button icon-button danger" onClick={() => removeMember(member)} disabled={!canEdit || isSaving} title={t("team.removeMember")}>
                <Trash2 size={15} />
              </button>
            </span>,
          ])}
          empty={t("team.noMembers")}
        />
      </section>
    </div>
  );
}

function AuditPage({ auditEvents, teamMembers }) {
  const { t } = useTranslation();
  const membersById = new Map(teamMembers.map((member) => [member.userId, member]));

  return (
    <section className="panel full-page-panel">
      <div className="panel-head">
        <div>
          <h2>{t("audit.title")}</h2>
          <p>{t("audit.subtitle")}</p>
        </div>
      </div>
      <DataTable
        columns={[t("audit.time"), t("audit.actor"), t("audit.action"), t("audit.entity"), t("audit.record")]}
        rows={auditEvents.map((event) => {
          const actor = membersById.get(event.actorUserId);
          return [
            new Date(event.createdAt).toLocaleString(),
            actor?.email ?? t("common.system"),
            event.action,
            event.entityType,
            event.entityId,
          ];
        })}
        empty={t("audit.empty")}
      />
    </section>
  );
}

function SettingsPage({ settings, setSettings, session, company, memberRole }) {
  const { t } = useTranslation();

  function updateSetting(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="page-grid settings-grid">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("settings.appearance")}</h2>
            <p>{t("settings.appearanceSubtitle")}</p>
          </div>
        </div>
        <div className="settings-list">
          <label className="setting-row">
            <span className="setting-icon">ກ</span>
            <span>
              <strong>{t("settings.language")}</strong>
              <small>{t("settings.languageHelp")}</small>
              <select value={settings.language} onChange={(event) => updateSetting("language", event.target.value)}>
                {languageOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.label}</option>
                ))}
              </select>
            </span>
          </label>
          <label className="setting-row">
            <input
              type="checkbox"
              checked={settings.darkMode}
              onChange={(event) => updateSetting("darkMode", event.target.checked)}
            />
            <span>
              <strong>{t("settings.darkMode")}</strong>
              <small>{t("settings.darkModeHelp")}</small>
            </span>
          </label>
          <label className="setting-row">
            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={(event) => updateSetting("compactMode", event.target.checked)}
            />
            <span>
              <strong>{t("settings.compactLayout")}</strong>
              <small>{t("settings.compactLayoutHelp")}</small>
            </span>
          </label>
          <label className="setting-row">
            <input
              type="checkbox"
              checked={settings.largeText}
              onChange={(event) => updateSetting("largeText", event.target.checked)}
            />
            <span>
              <strong>{t("settings.largerText")}</strong>
              <small>{t("settings.largerTextHelp")}</small>
            </span>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>{t("settings.workspace")}</h2>
            <p>{t("settings.workspaceSubtitle")}</p>
          </div>
        </div>
        <dl className="summary-list">
          <div>
            <dt>{t("common.company")}</dt>
            <dd>{company?.name ?? t("common.noCompany")}</dd>
          </div>
          <div>
            <dt>{t("common.role")}</dt>
            <dd>{roleLabel(memberRole, t)}</dd>
          </div>
          <div>
            <dt>{t("common.email")}</dt>
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
  const language = userSettings.language === "lo" ? "lo" : "en";
  const t = useMemo(() => createTranslator(language), [language]);
  const i18nValue = useMemo(() => ({ language, t }), [language, t]);

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
    { name: t("report.profitLoss"), period: t("period.may2025"), status: t("common.ready"), value: money(totals.profit) },
    { name: t("report.balanceSheet"), period: t("period.may2025"), status: t("common.ready"), value: money(totals.assets) },
    { name: t("report.trialBalance"), period: t("period.may2025"), status: totals.difference < 0.005 ? t("common.ready") : t("common.draft"), value: money(totals.difference) },
    { name: t("report.cashFlow"), period: t("period.may2025"), status: t("common.draft"), value: t("report.pendingClose") },
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
    document.documentElement.dataset.language = language;
    document.documentElement.lang = language === "lo" ? "lo" : "en";
    window.localStorage.setItem("accounting-user-settings", JSON.stringify(userSettings));
  }, [language, userSettings]);

  useEffect(() => {
    let mounted = true;
    async function initAuth() {
      try {
        const currentSession = await getCurrentSession();
        if (mounted) setSession(currentSession);
      } catch (error) {
        if (mounted) setAuthStatus(error?.message ?? t("auth.signInError"));
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
        setDataError(error?.message ?? t("common.loadingWorkspace"));
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
      setAuthStatus(error?.message ?? t("auth.signInError"));
    }
  }

  async function handleSignUp() {
    setAuthStatus("");
    try {
      const nextSession = await signUpWithEmail(authEmail, authPassword);
      setAuthPassword("");
      setAuthStatus(nextSession ? t("auth.accountCreated") : t("auth.confirmEmail"));
    } catch (error) {
      setAuthStatus(error?.message ?? t("auth.signUpError"));
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
      setDataError(t("common.noCompany"));
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
      setAccountStatus(t("accounts.required"));
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
      setAccountStatus(t("accounts.saved"));
    } catch (error) {
      setAccountStatus(error?.message ?? t("accounts.saveError"));
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
      setAccountStatus(t("accounts.deleted"));
      if (editingAccountCode === account.code) cancelAccountEdit();
    } catch (error) {
      setAccountStatus(error?.message ?? t("accounts.deleteError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveCustomerDraft() {
    if (!company?.id) return;
    if (!customerDraft.name.trim()) {
      setSalesStatus(t("sales.customerRequired"));
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
      setSalesStatus(t("sales.customerSaved"));
    } catch (error) {
      setSalesStatus(error?.message ?? t("sales.customerSaveError"));
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
      setSalesStatus(t("sales.invoiceRequired"));
      return;
    }

    if (!invoiceDraft.issueDate || !invoiceDraft.dueDate || invoiceDraft.dueDate < invoiceDraft.issueDate) {
      setSalesStatus(t("sales.invoiceDatesInvalid"));
      return;
    }

    if (!trimmedItems.length || trimmedItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setSalesStatus(t("sales.invoiceLinesInvalid"));
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
      setSalesStatus(t("sales.invoiceSubtotalInvalid"));
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
      setSalesStatus(t("sales.invoiceSaved"));
    } catch (error) {
      setSalesStatus(error?.message ?? t("sales.invoiceSaveError"));
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
      setSalesStatus(t("sales.invoicePosted", { entryNo: postedEntryNo }));
    } catch (error) {
      setSalesStatus(error?.message ?? t("sales.invoicePostError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveVendorDraft() {
    if (!company?.id) return;
    if (!vendorDraft.name.trim()) {
      setPurchaseStatus(t("purchases.vendorRequired"));
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
      setPurchaseStatus(t("purchases.vendorSaved"));
    } catch (error) {
      setPurchaseStatus(error?.message ?? t("purchases.vendorSaveError"));
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
      setPurchaseStatus(t("purchases.billRequired"));
      return;
    }

    if (!billDraft.billDate || !billDraft.dueDate || billDraft.dueDate < billDraft.billDate) {
      setPurchaseStatus(t("purchases.billDatesInvalid"));
      return;
    }

    if (!trimmedItems.length || trimmedItems.some((item) => !item.accountCode || !item.description || item.quantity <= 0 || item.unitCost < 0)) {
      setPurchaseStatus(t("purchases.billLinesInvalid"));
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
      setPurchaseStatus(t("purchases.billSubtotalInvalid"));
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
      setPurchaseStatus(t("purchases.billSaved"));
    } catch (error) {
      setPurchaseStatus(error?.message ?? t("purchases.billSaveError"));
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
      setPurchaseStatus(t("purchases.billPosted", { entryNo: postedEntryNo }));
    } catch (error) {
      setPurchaseStatus(error?.message ?? t("purchases.billPostError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddMember() {
    if (!company?.id) return;
    if (!inviteDraft.email.trim()) {
      setTeamStatus(t("team.emailRequired"));
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
      setTeamStatus(t("team.invitationSaved"));
    } catch (error) {
      setTeamStatus(error?.message ?? t("team.addError"));
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
      setOnboardingStatus(t("onboarding.companyCreated"));
    } catch (error) {
      setOnboardingStatus(error?.message ?? t("onboarding.companyCreateError"));
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
      setOnboardingStatus(t("onboarding.invitationAccepted"));
    } catch (error) {
      setOnboardingStatus(error?.message ?? t("onboarding.invitationAcceptError"));
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
      setTeamStatus(t("team.roleUpdated"));
    } catch (error) {
      setTeamStatus(error?.message ?? t("team.roleUpdateError"));
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
      setTeamStatus(t("team.memberRemoved"));
    } catch (error) {
      setTeamStatus(error?.message ?? t("team.memberRemoveError"));
    } finally {
      setIsSaving(false);
    }
  }

  function renderWithI18n(content) {
    return <I18nContext.Provider value={i18nValue}>{content}</I18nContext.Provider>;
  }

  if (!session) {
    return renderWithI18n(
      <LoginGate
        authEmail={authEmail}
        authPassword={authPassword}
        authStatus={authStatus}
        setAuthEmail={setAuthEmail}
        setAuthPassword={setAuthPassword}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />,
    );
  }

  if (!company && (dataStatus === "idle" || dataStatus === "loading")) {
    return renderWithI18n(
      <main className="login-page">
        <section className="login-panel">
          <div className="loading-panel">
            <RefreshCcw size={22} />
            {t("common.loadingWorkspace")}
          </div>
        </section>
      </main>,
    );
  }

  if (!company) {
    return renderWithI18n(
      <OnboardingPage
        companyNameDraft={companyNameDraft}
        setCompanyNameDraft={setCompanyNameDraft}
        invitations={availableInvitations}
        status={dataError || onboardingStatus}
        isSaving={isSaving}
        onCreateCompany={handleCreateCompany}
        onAcceptInvitation={handleAcceptInvitation}
        onSignOut={handleSignOut}
      />,
    );
  }

  return renderWithI18n(
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Landmark size={25} />
          <strong>{t("app.name")}</strong>
        </div>
        <nav className="side-nav" aria-label={t("nav.dashboard")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => setActivePage(item.id)}>
                <Icon size={19} />
                {t(item.labelKey)}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">AC</div>
          <div>
            <strong>{roleLabel(memberRole, t)}</strong>
            <span>{session.user.email}</span>
          </div>
        </div>
      </aside>

      <section className="main-workspace">
        <header className="topbar">
          <div>
            <p>{t("period.may2025")} - {company?.name ?? t("common.noCompany")}</p>
            <h1>{t(pageTitleKeys[activePage])}</h1>
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" onClick={handleSignOut}>
              <LogOut size={17} />
              {t("common.signOut")}
            </button>
          </div>
        </header>

        {dataError && <div className="notice warning">{dataError}</div>}
        {dataStatus === "loading" ? (
          <div className="loading-panel">
            <RefreshCcw size={22} />
            {t("common.loadingWorkspace")}
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
    </main>,
  );
}

export default App;
