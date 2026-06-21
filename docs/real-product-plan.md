# Accounting Prototype To Real Product Plan

## Current State

- Frontend: Vite React app deployed through GitHub Pages.
- Backend: Supabase project `ouzqatfjvstiqtmbfwas` in the Rabbitwork organization.
- Database: initial accounting schema and seed data are stored in Supabase migrations.
- Demo access: accounting tables are currently readable by anonymous users so the public GitHub Pages demo can load data.

## Phase 1: Supabase Data Integration

1. Add `@supabase/supabase-js` to the frontend.
2. Add public environment variables for the Supabase project URL and publishable/anon key.
3. Replace hard-coded account and journal seed reads with Supabase queries.
4. Keep local seed data as a fallback only for development or offline failure.
5. Display loading and error states for database reads.

## Phase 2: Real Write Workflow

1. Add Supabase Auth for team login.
2. Move journal create/update/post actions from `localStorage` to Supabase.
3. Replace public write access with authenticated write policies.
4. Add audit fields such as `created_by`, `updated_by`, `posted_by`, and `posted_at`.
5. Add validation rules for balanced entries before posting.

## Phase 3: Business Model

1. Add companies/workspaces.
2. Add company membership roles: owner, accountant, reviewer, viewer.
3. Scope accounts, journal entries, and reports by company.
4. Update RLS policies so users can only access companies where they are members.
5. Add period/month close status and lock posted periods.

## Phase 4: Accounting Features

1. Make chart of accounts fully editable.
2. Add multi-line journal entries.
3. Add attachments through Supabase Storage.
4. Generate trial balance, profit and loss, balance sheet, and cash-flow reports from database rows.
5. Add import workflows for Excel source files.

## Phase 5: Production Readiness

1. Move from anonymous demo reads to authenticated access for private company data.
2. Add database indexes and views for reports.
3. Add tests for posting, balancing, permissions, and report totals.
4. Add backup/export workflows.
5. Add deployment environment checks for GitHub Pages and Supabase keys.
