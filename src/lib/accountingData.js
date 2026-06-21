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
    email: row.email,
    role: row.role,
    status: row.status,
    invitedBy: row.invited_by,
    createdAt: row.created_at,
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
    return {
      configured: true,
      company: null,
      role: null,
      accounts: [],
      entries: [],
    };
  }

  const [accountsResult, entriesResult, linesResult, teamResult, invitationsResult] = await Promise.all([
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
      .select("id,company_id,email,role,status,invited_by,created_at")
      .eq("company_id", company.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const error = accountsResult.error ?? entriesResult.error ?? linesResult.error ?? teamResult.error ?? invitationsResult.error;
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
