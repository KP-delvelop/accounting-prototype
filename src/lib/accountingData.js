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

  const { error: entryError } = await supabase.from("accounting_journal_entries").upsert({
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
