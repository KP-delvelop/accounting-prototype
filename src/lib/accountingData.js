import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

function mapAccount(row) {
  return {
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

export async function loadAccountingWorkspace() {
  if (!isSupabaseConfigured || !supabase) {
    return { configured: false };
  }

  const [accountsResult, entriesResult, linesResult] = await Promise.all([
    supabase.from("accounting_accounts").select("*").order("code", { ascending: true }),
    supabase.from("accounting_journal_entries").select("*").order("entry_date", { ascending: true }),
    supabase
      .from("accounting_journal_lines")
      .select("entry_no,line_no,account_code,side,amount")
      .order("entry_no", { ascending: true })
      .order("line_no", { ascending: true }),
  ]);

  const error = accountsResult.error ?? entriesResult.error ?? linesResult.error;
  if (error) {
    throw error;
  }

  return {
    configured: true,
    accounts: (accountsResult.data ?? []).map(mapAccount),
    entries: (entriesResult.data ?? []).map((entry) => mapJournalEntry(entry, linesResult.data ?? [])),
  };
}
