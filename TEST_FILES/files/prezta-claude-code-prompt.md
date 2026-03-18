# Prezta — Claude Code Init Prompt
> Copy-paste this into Claude Code at project root. First run: analysis + next task. Subsequent runs: next task only.

---

## PROMPT 1 — PROJECT ANALYSIS (run once at session start)

```
You are the sole engineer on Prezta — a SaaS workspace for French/Belgian/Swiss freelancers.
Stack: React 18 + TypeScript strict + Vite + Tailwind v4 + shadcn/ui + React Router v7 + Supabase + Vercel.

## YOUR FIRST JOB: ANALYSE THE PROJECT

Run the following in order, then give me a structured status report:

1. Read package.json → list all installed deps + versions
2. Read src/ directory tree (2 levels deep)
3. Read supabase/migrations/ or check for schema files
4. Check for any existing .env.example or env variable references
5. Scan src/pages/ and src/components/ for existing routes and components
6. Read any existing README or NOTES files

## REPORT FORMAT (required):

### ✅ CONFIRMED DONE
List every feature you can verify is implemented (file exists + has real content).

### 🔶 PARTIAL / UNCERTAIN
Features where files exist but implementation looks incomplete or unclear.

### ❌ NOT STARTED
Features missing from the codebase entirely.

### 🗄️ DATABASE STATUS
Which Supabase tables exist (from migrations or types). Flag any missing RLS policies.

### 🔧 ENVIRONMENT
Which env vars are defined vs missing. Flag any broken imports or missing deps.

### 📍 NEXT TASK RECOMMENDATION
Based on the roadmap below and what you found, state the single next task to implement — with reasoning.

---

## ROADMAP REFERENCE (Phase 1 — Le Socle)

**DONE (marked in roadmap):**
- 1.1 Setup: Vite + React + TS + Tailwind v4 + shadcn. Repo, ESLint, Vercel dual-domain.
- 1.2 Auth: Supabase Auth + AuthContext + ProtectedRoute + Magic Link + route guards.
- 1.3 Profile: SIRET validation (14 digits Luhn), TVA FR, IBAN, statut juridique (auto-entrepreneur/EURL/SASU/SAS/SARL), CGI art.293B auto.
- 1.4 Clients: CRUD, search, inline creation. Table `clients` with RLS.
- 1.5 Catalogue: Table `products` RLS, CRUD, starred favorites, Gemini generates 8 services on first login.
- 1.6 Project wizard: 3-step (Name → Client → Documents), Zustand state, Gemini doc suggestions.

**NEXT IN QUEUE (in order):**
- 1.4b Client activity timeline (auto from existing data, no extra input)
- 1.4c CSV client import (parse, preview, column mapping, batch insert)
- 1.7 Full UI redesign — white design system + landing page (see design tokens below)
- 1.8 Quote builder — catalogue → qty → live PDF preview, Gemini "create from brief"
- 1.9 PDF generation — React-PDF + pdf-lib, auto legal mentions by status/country
- 1.10 Invoice register — table `invoices`, payment status, 5-second add flow
- 1.11 Main dashboard — KPI stats, active projects, required actions, skeleton loaders
- 1.12 Gemini chat — slide-in panel, context cache (profile + catalogue + 30d data), 50/200 msg limits
- 1.13 Lemon Squeezy subscriptions — Free (3 projects) vs Pro €14/mo, webhooks → Supabase
- 1.14 Transactional emails — Resend + React Email, welcome/confirm/receipt/reset in French

**Design tokens (for 1.7):**
```css
--background: #FFFFFF; --surface: #F8F9FA; --surface-hover: #F1F3F5;
--border: #E9ECEF; --border-strong: #DEE2E6;
--text-primary: #212529; --text-secondary: #495057; --text-muted: #868E96;
--brand: #2563EB; --brand-hover: #1D4ED8; --brand-light: #EFF6FF; --brand-border: #BFDBFE;
--success: #16A34A; --success-light: #F0FDF4;
--warning: #D97706; --warning-light: #FFFBEB;
--danger: #DC2626; --danger-light: #FEF2F2;
--sidebar-bg: #F8F9FA; --sidebar-border: #E9ECEF;
--sidebar-item-active: #EFF6FF; --sidebar-text-active: #2563EB;
```

## CONSTRAINTS (apply to ALL tasks, always)
- TypeScript strict — zero `any`
- Tailwind v4 only (no v3 deprecated classes)
- shadcn/ui for all UI components
- All user-facing text in French
- `tsc` and `vite build` must pass clean
- Supabase RLS on every new table
- No hardcoded secrets — env vars only
```

---

## PROMPT 2 — EXECUTE NEXT TASK (use after analysis, or at any session start once project state is known)

```
You are the sole engineer on Prezta. Context:
- Stack: React 18 + TypeScript strict + Vite + Tailwind v4 + shadcn/ui + React Router v7 + Supabase + Vercel
- Phase 1 tasks 1.1–1.6 are confirmed done.
- The roadmap is in PREZTA_ROADMAP.md (or use the reference below if file not present).

## YOUR JOB: IMPLEMENT [TASK_ID — TASK_NAME]

Before writing any code:
1. Read the relevant existing files (check for conflicts, existing patterns, naming conventions)
2. State your implementation plan in 3–5 bullet points
3. Ask ONE clarifying question only if truly blocked — otherwise proceed

Then implement:
- Write all required files in full (no placeholders, no TODOs)
- Follow existing file/folder conventions exactly
- Add Supabase migration SQL if new tables are needed
- Export types from src/types/ if adding new data models
- Update React Router routes if adding new pages
- Run `tsc --noEmit` mentally — flag any type issues before finishing

When done:
- List every file created or modified
- State what to test manually (3 bullet points max)
- State the next task in queue

## CONSTRAINTS (always enforced)
- TypeScript strict — zero `any`
- Tailwind v4 only
- shadcn/ui components
- All UI text in French
- RLS on every new Supabase table
- No hardcoded secrets
```

---

## PROMPT 3 — DEBUG / FIX MODE

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn + Supabase).

## BUG REPORT
[paste error message / describe the issue]

## YOUR JOB
1. Read the relevant file(s) first — do not guess
2. Identify root cause (1 sentence)
3. Fix it — minimal change, no refactor unless the bug requires it
4. Verify fix doesn't break TypeScript strict or existing tests
5. If the fix touches Supabase schema, include migration SQL

Do not change code unrelated to this bug.
```

---

## QUICK REFERENCE — Full Roadmap Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | Le Socle | ✅ Done |
| 2 | La Confiance | ✅ Done |
| 3 | L'Autonomie | ✅ Done |
| 4 | L'Intelligence | ✅ Done |
| 5 | Le Temps | 🔶 In progress |

**Phase 1 — DONE:** 1.1 Setup · 1.2 Auth · 1.3 Profile · 1.4 Clients · 1.4b Timeline · 1.4c CSV import · 1.4d SIRENE · 1.5 Catalogue · 1.6 Wizard · 1.7 UI redesign · 1.8 Quote builder · 1.9 PDF generation · 1.10 Invoice register · 1.11 Dashboard · 1.12 Gemini chat · 1.13 Lemon Squeezy · FIRMA signer fix · LS key security fix

**Phase 2 — DONE:** 2.1+2.2 Contract templates + clause generator · 2.3+2.4 FIRMA pipeline + status · 2.4b Quote read-tracking · 2.4c Email templates · 2.5 Auto-naming + versioning · 2.6 Smart reminders · 2.7 Task planning · 2.8 Plausible + Sentry

**Phase 3 — DONE:** 3.1 Cost calculator · 3.2 Revenue dashboard · 3.3 Doc expiry alerts · 3.4 Accounting ZIP · 3.5 Client portal · 3.6 Auto legal mentions · 3.7a Pricing page · 3.7b Plan enforcement · 3.8 Route optimization

**Phase 4 — DONE:** 4.1 Auto analytics · 4.2 Rate benchmark · 4.3 Seasonality · 4.4 Factur-X

**Phase 5 queue:** 5.1+5.2+5.3 Timer + Manual entry + Timesheet → 5.4 Convert → invoice → 5.5 Profitability chat

---

## PLANS TARIFAIRES — RÉFÉRENCE DÉFINITIVE

| Fonctionnalité | Gratuit (14j) | Starter 9€/mois | Pro 19€/mois |
|---|---|---|---|
| Projets | 3 | 10 | Illimités |
| Documents actifs (≠ archivé) | 15 | 50 | Illimités |
| Stockage | 500 Mo | 2 Go | 10 Go |
| CRUD clients + SIRENE + CSV import | ✅ | ✅ | ✅ |
| Timeline activité client | ✅ | ✅ | ✅ |
| Wizard projet + tâches + planning | ✅ | ✅ | ✅ |
| Optimisation trajets (Gemini + Maps) | ❌ | ❌ | ✅ |
| Constructeur devis + PDF + versioning | ✅ | ✅ | ✅ |
| Templates contrats FR (4 types) + éditeur blocs | ✅ | ✅ | ✅ |
| Générateur de clauses IA (Gemini) | ❌ | ❌ | ✅ |
| Statuts documents pipeline | ✅ | ✅ | ✅ |
| Tracking lecture devis | ❌ | ❌ | ✅ |
| Alertes expiration documents | ❌ | ❌ | ✅ |
| E-signature FIRMA | ❌ | 3/mois | Illimitées |
| Signatures à la carte | ❌ | 1€/signature | — |
| Registre facturation | ✅ | ✅ | ✅ |
| Relances paiement intelligentes (Gemini) | ❌ | ❌ | ✅ |
| Bibliothèque templates emails | ✅ | ✅ | ✅ |
| Export comptable ZIP | ❌ | ❌ | ✅ |
| Catalogue prestations + calculateur prix | ✅ | ✅ | ✅ |
| Génération IA catalogue (onboarding) | ❌ | ❌ | ✅ |
| Dashboard revenus (Recharts) | ❌ | ❌ | ✅ |
| Portail client (lien unique 90j) | ❌ | ❌ | ✅ |
| Plausible + Sentry | ✅ | ✅ | ✅ |
| Support prioritaire | ❌ | ❌ | ✅ |
| **Prix mensuel** | Gratuit | **9€/mois** | **19€/mois** |
| **Prix annuel** | — | **7,20€/mois** (86,40€/an) | **15,20€/mois** (182,40€/an) |

**Règle documents actifs :** compteur = documents avec status ≠ 'archivé' par user.
Versioning (v1→v2) = 1 slot. Archiver libère 1 slot immédiatement.
À la limite : document créé en brouillon non envoyable + nudge upgrade.

---

## PROMPT 11 — PHASE 3 / TASK 3.1 + 3.2 · Cost calculator + Revenue dashboard

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1 and 2 are fully done. You are opening Phase 3 — L'Autonomie — with tasks 3.1 and 3.2.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/types/ — all existing type exports, follow naming conventions exactly
2. src/pages/QuoteBuilderPage.tsx — catalogue line item pattern to reuse in cost calculator
3. src/hooks/useDashboard.ts + src/pages/DashboardPage.tsx — existing KPI card + Recharts
   bar chart pattern to follow for the revenue dashboard
4. supabase/migrations/ — latest migration number to increment, and invoices table schema
   (revenue dashboard reads from invoices)
5. package.json — confirm recharts is installed

State your implementation plan in 4 bullet points, then proceed.

## 3.1 — Cost calculator (prix de revient)

A standalone calculator that helps freelancers price a job correctly before quoting.
No new Supabase table needed — this is a stateful UI tool, not persisted data.

1. New page src/pages/CostCalculatorPage.tsx at route /calculateur:
   - Add "Calculateur" entry to AppLayout sidebar under a "Outils" section group

2. Calculator sections (all reactive — totals update live):
   - Matériaux: rows of { description, quantity, unit_price } — add/remove rows
   - Main d'œuvre: rows of { description, hours, hourly_rate } — add/remove rows
   - Déplacements: rows of { description, km, rate_per_km } — add/remove rows
     Default rate_per_km: 0.50€ (barème kilométrique FR 2026)
   - Marge: single percentage input (0–100%)

3. Computed outputs (display in a sticky summary card):
   - Coût total matériaux HT
   - Coût total main d'œuvre HT
   - Coût total déplacements HT
   - Sous-total coût de revient HT
   - Marge appliquée (€)
   - Prix de vente conseillé HT (bold, large)
   - Prix de vente conseillé TTC (at 20% TVA)

4. Two action buttons:
   - "Exporter vers le catalogue" — creates a new product in the products table with
     the calculated HT price and a description summarising the job; redirects to /catalogue
   - "Créer un devis" — pre-fills QuoteBuilderPage with one line item using the
     calculated price and a default description; navigate to /devis/nouveau with state

## 3.2 — Revenue dashboard

A dedicated analytics page showing CA over time, built entirely from the existing
invoices table — zero extra data entry required.

1. New page src/pages/RevenueDashboardPage.tsx at route /revenus:
   - Add "Revenus" entry to AppLayout sidebar under the existing "Principal" section

2. Period filter (top of page): Mois en cours · Trimestre · Année · 12 derniers mois
   All charts and stats respond to this filter reactively.

3. KPI row (4 cards, reuse existing mini-stat card style from DashboardPage):
   - CA de la période (invoices status='paid', sum of amount)
   - En attente de paiement (status='pending'|'overdue', sum)
   - Factures émises (count)
   - Taux de recouvrement (paid / total issued, %)

4. Charts (Recharts — follow existing bar chart pattern):
   - Bar chart: CA mensuel sur la période sélectionnée (one bar per month)
   - Bar chart: Top 5 clients par CA (horizontal bars, client name on Y axis)

5. Comparison line (below KPI row):
   - "vs période précédente" — compute same metrics for the prior equivalent period
   - Show delta as: ↑ +18% in success color or ↓ -5% in danger color
   - Use same period logic: if "Mois en cours" selected, prior = last month

6. Data hook src/hooks/useRevenueDashboard.ts:
   - All queries in one hook, keyed by period filter
   - Returns: { kpis, monthlyRevenue, topClients, previousPeriodKpis }
   - Use TanStack Query with appropriate staleTime (5 min — revenue data is not real-time)

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- No new Supabase tables — read from existing invoices + clients tables only
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 3.3 document expiry alerts + 3.4 accounting ZIP export
```

---

*Prezta Roadmap v7 · March 2026 · prezta.fr*

---

## PROMPT 4 — PHASE 2 / TASK 2.1 + 2.2 · Contract templates + AI clause generator

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phase 1 is fully done. You are implementing Phase 2, tasks 2.1 and 2.2.

## BEFORE WRITING ANY CODE — READ FIRST:
1. supabase/migrations/00005_* — contract_templates table schema
2. src/components/pdf/ContractPDFDocument.tsx — existing PDF structure
3. src/components/pdf/QuotePDFDocument.tsx — follow same patterns
4. src/lib/legal-mentions.ts — reuse existing legal mention logic
5. src/pages/QuoteBuilderPage.tsx — follow same builder UX pattern
6. src/types/ — existing type exports, follow naming conventions

State your implementation plan in 4 bullet points, then proceed.

## 2.1 — Contract templates library

Create a templates library with these 4 contracts (French law only):
- Contrat de prestation de services
- NDA (Accord de confidentialité)
- CGV (Conditions Générales de Ventes)
- Contrat de mission freelance

Each template must:
- Auto-fill variables from `profiles` table (nom, adresse, SIRET, statut juridique)
- Auto-fill variables from `clients` table (nom, adresse, contact_name, TVA)
- Inject legal mentions automatically via existing legal-mentions.ts:
  * Auto-entrepreneur → CGI art. 293B
  * EURL/SASU/SAS/SARL → numéro RCS + ville
  * All → pénalités de retard (3× taux BCE) + indemnité forfaitaire 40€

Block editor:
- User can add / remove / reorder text clause blocks
- Save custom template to contract_templates table (Supabase, RLS already exists)
- Extend ContractPDFDocument.tsx to support all 4 types
- PDF naming: YYYY-MM-CLIENT-[Type]-v1.pdf (use existing naming util or create one)

## 2.2 — AI clause generator (inside the block editor)

Add "✦ Ajouter une clause" button in the block editor:
- Text input: user describes clause in plain French (ex: "maximum 2 révisions incluses")
- Call Gemini (gemini-2.0-flash) using existing Gemini integration pattern — no new API keys
- Prompt to Gemini: "Rédige une clause professionnelle pour un contrat freelance français basée sur: [input]. Réponds uniquement avec le texte de la clause, sans titre, sans explication."
- Show generated clause in a preview card
- "Insérer" button → appends clause as new block in editor
- Loading state during generation, error state if Gemini fails

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- No new API keys or env vars
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 2.3 + 2.4 FIRMA pipeline + status
```

---

## PROMPT 5 — PHASE 2 / TASK 2.3 + 2.4 · FIRMA signature pipeline + document status

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phase 2 tasks 2.1 and 2.2 are done. You are implementing tasks 2.3 and 2.4.

## BEFORE WRITING ANY CODE — READ FIRST:
1. All files referencing FIRMA or firma — read every one completely
2. src/types/ — existing document/quote/contract type definitions
3. supabase/migrations/ — quotes and contracts table schemas, check for existing status columns
4. src/pages/InvoicesPage.tsx + QuoteBuilderPage.tsx — existing status badge patterns
5. src/hooks/useDashboard.ts — existing actions feed logic to extend

State your implementation plan in 4 bullet points, then proceed.

## 2.3 — FIRMA e-signature pipeline

Improve the existing FIRMA integration so that:
1. Any document (quote, contract, NDA) can be sent for signature from its detail page
   via a consistent "Envoyer pour signature" button
2. Before sending, show a confirmation modal with:
   - Signer name (contact_name from clients table — already fixed)
   - Signer email
   - Document title and type
   - "Confirmer l'envoi" / "Annuler" buttons
3. Signer name must use contact_name, never company name — verify the fix is in place,
   if not fix it here
4. If client has no contact_name set, block the send button with inline message:
   "Ajoutez le nom du signataire dans la fiche client avant d'envoyer"

## 2.4 — Document status pipeline

Statuses: Brouillon → Envoyé → Lu → Signé → Archivé

1. Add `status` and `status_history jsonb` columns to quotes and contracts tables
   if not already present — write migration SQL with RLS
2. FIRMA webhook handler → update document status automatically in Supabase
3. Status badge component (reusable) with these exact colors:
   - Brouillon: var(--text-muted) background var(--surface)
   - Envoyé: var(--brand) background var(--brand-light)
   - Lu: var(--warning) background var(--warning-light)
   - Signé: var(--success) background var(--success-light)
   - Archivé: var(--text-disabled) background var(--surface)
4. Apply badge to: quotes list, contracts list, project document list
5. Stale alert logic: status = "Envoyé" for 7+ days with no change →
   appear in "Actions Requises" feed on dashboard as "En attente de signature depuis Xj"
   Extend useDashboard.ts to include this query

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- RLS on any new columns / tables
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 2.4b quote read-tracking
```

---

## PROMPT 6 — PHASE 2 / TASK 2.4b + 2.4c · Quote read-tracking + Email template library

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phase 2 tasks 2.1–2.4 are done. Status pipeline, DocumentStatusBadge, SendForSignatureModal all exist.
You are implementing tasks 2.4b and 2.4c.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/types/quote.ts — QuoteStatus, StatusHistoryEntry, sent_at, status_history (just added)
2. supabase/functions/firma-webhook/index.ts — follow same webhook pattern for the tracking endpoint
3. src/hooks/useDashboard.ts — stale document query pattern to reuse
4. src/lib/resend.ts + src/emails/WelcomeEmail.tsx — existing email setup and template pattern
5. supabase/migrations/00018_* — status_history jsonb pattern to reuse for quotes

State your implementation plan in 4 bullet points, then proceed.

## 2.4b — Quote read-tracking

When a quote is shared via unique link, record when the client opens it:

1. Vercel Edge Function api/track-quote-view.ts:
   - Accepts GET ?token=[quote_token]
   - Looks up quote by token in Supabase (service role)
   - If status is currently 'sent': update to 'lu', append to status_history, set viewed_at
   - If already 'lu' or beyond: only append to status_history (no status regression)
   - Returns a 1×1 transparent GIF (pixel response)
   - Anonymise IP — do not store raw IP

2. Quote share page (find existing share/public quote page or create /q/[token]):
   - Embed <img src="/api/track-quote-view?token=[token]" width="1" height="1" /> invisibly
   - Fires on page load, triggering the edge function

3. In-app: when status flips to 'lu' → show in "Actions Requises":
   "Dupont a consulté votre devis — aujourd'hui à HH:MM"
   Use existing DocumentStatusBadge with 'lu' status

4. Add viewed_at TIMESTAMPTZ column to quotes table — new migration SQL with RLS

## 2.4c — Email template library

1. New Supabase table email_templates (migration + RLS):
   - id, user_id, type (enum), subject, body_html, variables jsonb, created_at
   - Types: 'devis_envoi' | 'contrat_envoi' | 'relance_1' | 'relance_2' | 'relance_3' | 'relance_mise_en_demeure' | 'remerciement_signature'
   - Seed 7 default French templates on table creation (INSERT … ON CONFLICT DO NOTHING)

2. Default template tones (French, professional):
   - devis_envoi / contrat_envoi: neutral professional
   - relance_1 (1–15j): amical
   - relance_2 (16–30j): ferme
   - relance_3 (31–60j): formel + mention pénalités légales
   - relance_mise_en_demeure (60j+): mise en demeure formelle
   - remerciement_signature: confirmation chaleureuse

3. Template editor at /parametres/emails:
   - List all 7 types with labels
   - Click to edit: subject + body textarea
   - Variable token chips shown: {{client_name}} {{doc_title}} {{amount}} {{due_date}} {{company_name}}
   - Save (upsert by user_id + type) + "Réinitialiser" button per template

4. Hook useEmailTemplates:
   - getTemplate(type): returns user custom or default
   - substituteVars(template, vars: Record<string, string>): variable replacement util

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- RLS on all new tables
- Edge function uses service role key — never VITE_ prefix
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 2.5 auto-naming + versioning
```

---

## PROMPT 7 — PHASE 2 / TASK 2.5 + 2.6 · Auto-naming + versioning · Smart payment reminders

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phase 2 tasks 2.1–2.4c are done. email_templates table, useEmailTemplates hook, and
DocumentStatusBadge all exist and are working.
You are implementing tasks 2.5 and 2.6.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/types/quote.ts + src/types/contract.ts — current shape of quote/contract objects
2. src/hooks/useEmailTemplates.ts — getTemplate() and substituteVars() (just built in 2.4c)
3. src/lib/resend.ts — existing send email utility
4. src/pages/InvoicesPage.tsx — invoice list, how reminders are currently triggered if at all
5. src/components/contracts/SendForSignatureModal.tsx — modal pattern to follow for preview modals
6. supabase/migrations/ — latest migration number to increment correctly

State your implementation plan in 4 bullet points, then proceed.

## 2.5 — Auto-naming + versioning

Every document (quote, contract, invoice) must follow a consistent naming convention
and support versioning when edited after being sent.

1. Create src/lib/document-naming.ts utility:
   - generateDocumentName(type, clientName, date, version): string
   - Format: YYYY-MM-[CLIENT]-[Type]-v[N].pdf
     * type values: 'Devis' | 'Facture' | 'Contrat-prestation' | 'NDA' | 'CGV' | 'Contrat-mission'
     * clientName: uppercase, accents stripped, spaces replaced with hyphens, max 20 chars
     * date: document created_at date (YYYY-MM)
     * version: integer, default 1
   - Examples: 2026-03-DUPONT-Devis-v1.pdf · 2026-03-MARTIN-Contrat-prestation-v2.pdf

2. Versioning logic — when a document with status 'sent' | 'lu' | 'signed' is edited:
   - Block direct edit — show dialog: "Ce document a déjà été envoyé. Créer une nouvelle version ?"
   - On confirm: duplicate the document record, increment version, set status back to 'brouillon'
   - Keep original read-only, accessible via version history
   - Add version_of UUID nullable FK on quotes + project_contracts tables (migration SQL)

3. Version history UI:
   - On quote/contract detail: small "Historique des versions" collapsible (shadcn Collapsible)
   - Shows v1, v2… with status badge + date for each
   - Click any version → opens read-only PDF preview

4. Apply generateDocumentName() everywhere PDFs are currently exported — find all
   pdf download handlers and replace any hardcoded or ad-hoc naming with this util.

## 2.6 — Smart payment reminders

When a freelancer clicks "Relancer" on an overdue invoice, Gemini generates the right
email tone based on how many days overdue it is, using the email_templates as base structure.

1. Reminder trigger in InvoicesPage.tsx (and invoice detail if it exists):
   - "Relancer" button visible on invoices with status 'overdue' or 'pending' past due_date
   - Clicking opens ReminderPreviewModal (new component)

2. ReminderPreviewModal:
   - Calculate days overdue from due_date to today
   - Select template level automatically:
     * 1–15j  → 'relance_1'
     * 16–30j → 'relance_2'
     * 31–60j → 'relance_3'
     * 60j+   → 'relance_mise_en_demeure'
   - Call getTemplate(level) from useEmailTemplates, substituteVars() with invoice data
   - Pass that as base context to Gemini (gemini-2.0-flash) with prompt:
     "Tu es un assistant pour freelances français. Améliore cet email de relance de paiement
     en gardant exactement le même ton et la même structure. Facture : {{doc_title}},
     montant : {{amount}}€, retard : {{days_overdue}} jours. Email de base : {{base_email}}.
     Réponds uniquement avec l'email amélioré, sans explication."
   - Show editable textarea pre-filled with Gemini output (user can tweak before sending)
   - Subject line pre-filled from template, also editable
   - "Envoyer" button → calls resend.ts with final subject + body to client email
   - On send success: append to invoice status_history, show toast "Relance envoyée"

3. Reminder tracking:
   - Add last_reminder_sent_at TIMESTAMPTZ + reminder_count INT (default 0) to invoices table
   - Update both on each send
   - Show in invoice row: "Relancé il y a Xj (N fois)" if reminder_count > 0

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- RLS on all new columns/tables
- Gemini call server-side via existing Edge Function pattern — never expose key client-side
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 2.7 task planning per project
```

---

## PROMPT 8 — PHASE 2 / TASK 2.7 + 2.8 · Task planning + Plausible + Sentry · CLOSES PHASE 2

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phase 2 tasks 2.1–2.6 are done. You are implementing 2.7 and 2.8 — the final two tasks of Phase 2.

## BEFORE WRITING ANY CODE — READ FIRST:
1. supabase/migrations/ — find existing tasks + calendar_events tables (migration 00010),
   read their schema fully before touching anything
2. src/pages/DashboardPage.tsx + src/hooks/useDashboard.ts — "Actions Requises" feed
   to extend with overdue tasks
3. src/components/projects/ProjectDashboardModal.tsx — existing project detail UI,
   tasks will be added here
4. src/types/ — all existing type exports, follow naming conventions exactly
5. package.json — check if @sentry/react and plausible-tracker are already installed

State your implementation plan in 4 bullet points, then proceed.

## 2.7 — Task planning per project

Each project gets a task list with priorities, due dates, and a cross-project weekly view.

1. Extend existing tasks table if needed (check migration 00010 first — do not recreate):
   - Required columns: id, user_id, project_id FK, title, priority ('haute'|'normale'|'basse'),
     status ('a_faire'|'en_cours'|'termine'), due_date DATE nullable,
     linked_document_id UUID nullable, created_at
   - If columns are missing: write incremental migration SQL only for what's absent
   - RLS: user sees only their own tasks

2. Task list inside ProjectDashboardModal (or project detail page — read existing structure):
   - Inline add: single text input + priority select + date picker → Enter to save
   - Task row: checkbox to toggle status, title, priority badge, due date, delete icon
   - Priority badges: haute=danger, normale=brand, basse=muted (use design tokens)
   - Overdue tasks (due_date < today + status != 'termine'): row tinted warning-light

3. Cross-project weekly view at /planning:
   - New page src/pages/PlanningPage.tsx
   - Grid: rows = days Mon–Sun current week, columns = projects (or flat list sorted by due_date)
   - Each task card shows: title (truncated), project name chip, priority dot
   - Navigation: prev/next week arrows
   - Add route in React Router

4. Dashboard feed extension in useDashboard.ts:
   - Query tasks where status != 'termine' AND due_date < today
   - Surface in "Actions Requises" as "Tâche en retard : [title] — Projet : [project_name]"
   - Badge: danger

## 2.8 — Plausible analytics + Sentry error tracking

Two independent integrations — lightweight, no configuration UI needed.

### Plausible
1. Check package.json — install plausible-tracker if absent
2. Create src/lib/plausible.ts:
   - initPlausible(): initialise with domain from VITE_PLAUSIBLE_DOMAIN env var
   - trackEvent(name: string, props?: Record<string, string>): void — no-op if var missing
3. Initialise in main.tsx (call initPlausible() once)
4. Track these events only (no PII ever):
   - 'quote_created', 'contract_sent', 'invoice_paid', 'reminder_sent', 'signature_requested'
   - Add trackEvent() calls at the relevant action points in existing code
5. Add VITE_PLAUSIBLE_DOMAIN to .env.example with comment: # your-domain.com

### Sentry
1. Check package.json — install @sentry/react if absent
2. Create src/lib/sentry.ts:
   - initSentry(): configure with VITE_SENTRY_DSN env var, tracesSampleRate: 0.1
   - No-op gracefully if VITE_SENTRY_DSN is missing (dev safety)
3. Initialise in main.tsx (call initSentry() before React renders)
4. Wrap root component with Sentry.ErrorBoundary in main.tsx — fallback: simple French
   error card "Une erreur est survenue. Rechargez la page."
5. Add VITE_SENTRY_DSN to .env.example with comment: # from sentry.io project settings
6. Do NOT add source maps upload config — that requires CI setup, out of scope here

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- RLS on any new/modified tables
- Plausible + Sentry keys use VITE_ prefix (read-only, public-safe — confirmed acceptable)
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm Phase 2 is fully closed
- State the first task of Phase 3: 3.1 cost calculator
```

---

## PROMPT 9 — PHASE 2 AUDIT · Full verification before Phase 3

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phase 2 is declared complete. Before starting Phase 3, audit every Phase 2 task thoroughly.
Do not write any new features. Read, verify, and report only.

## YOUR JOB: AUDIT PHASE 2 — READ EVERYTHING FIRST

For each task below, locate the relevant files, read their actual content, and verdict:
✅ SOLID — fully implemented, no gaps
⚠️ PARTIAL — exists but something is missing or broken
❌ MISSING — not implemented at all

---

## CHECKLIST

### 2.1 — Contract templates
- [ ] 4 template types exist: prestation, NDA, CGV, mission freelance
- [ ] Variables auto-filled from profiles + clients tables
- [ ] Legal mentions injected by status: CGI 293B / RCS+ville / pénalités BCE / 40€ indemnité
- [ ] Block editor: add / remove / reorder clauses
- [ ] Custom templates saved to contract_templates table with RLS
- [ ] ContractPDFDocument.tsx handles all 4 types
- [ ] PDF naming follows YYYY-MM-CLIENT-Type-vN.pdf convention

### 2.2 — AI clause generator
- [ ] "Ajouter une clause IA" button in block editor
- [ ] Calls Gemini (gemini-2.0-flash) server-side — not client-side
- [ ] Preview card shown before inserting
- [ ] Inserts clause as new block on confirm
- [ ] Loading + error states handled

### 2.3 — FIRMA e-signature pipeline
- [ ] "Envoyer pour signature" available on quotes AND contracts
- [ ] SendForSignatureModal shows: signer name, email, document title, type
- [ ] Signer uses contact_name — never company name
- [ ] Blocked with inline error if contact_name is missing on client

### 2.4 — Document status pipeline
- [ ] status + status_history columns exist on quotes + project_contracts (migration 00018)
- [ ] FIRMA webhook updates status automatically (viewed → lu, signed → signé)
- [ ] DocumentStatusBadge applied on: quotes list, contracts list, project document list
- [ ] Stale alert in dashboard "Actions Requises": sent 7+ days → "En attente depuis Xj"

### 2.4b — Quote read-tracking
- [ ] Vercel Edge Function api/track-quote-view.ts exists
- [ ] Tracking pixel embedded in quote share page
- [ ] Status flips sent → lu on first view, no regression beyond lu
- [ ] viewed_at column exists on quotes table (migration)
- [ ] Dashboard feed shows "Dupont a consulté votre devis"
- [ ] IP anonymised — not stored raw

### 2.4c — Email template library
- [ ] email_templates table exists with RLS (migration)
- [ ] 7 default templates seeded: devis_envoi, contrat_envoi, relance_1/2/3, mise_en_demeure, remerciement
- [ ] Template editor at /parametres/emails — list, edit, save, reset
- [ ] Variable chips shown: {{client_name}} {{doc_title}} {{amount}} {{due_date}} {{company_name}}
- [ ] useEmailTemplates hook: getTemplate() + substituteVars() exported and typed

### 2.5 — Auto-naming + versioning
- [ ] src/lib/document-naming.ts exists with generateDocumentName()
- [ ] Format: YYYY-MM-CLIENT-Type-vN.pdf — applied everywhere PDFs are exported
- [ ] Editing a sent/lu/signed doc triggers version dialog
- [ ] version_of FK exists on quotes + project_contracts (migration)
- [ ] Version history collapsible UI on document detail

### 2.6 — Smart payment reminders
- [ ] "Relancer" button on overdue/pending invoices
- [ ] ReminderPreviewModal: auto-selects level by days overdue (1-15/16-30/31-60/60+)
- [ ] Gemini call is server-side via Edge Function — not exposed client-side
- [ ] Generated email shown in editable textarea before sending
- [ ] Sends via resend.ts on confirm
- [ ] last_reminder_sent_at + reminder_count columns on invoices (migration)
- [ ] Invoice row shows "Relancé il y a Xj (N fois)"

### 2.7 — Task planning
- [ ] tasks table has all required columns (check migration 00010 + any incremental)
- [ ] Task list inside project detail: inline add, checkbox, priority badge, due date, delete
- [ ] Overdue task rows tinted warning-light
- [ ] /planning page exists with weekly grid view + prev/next navigation
- [ ] Route registered in React Router
- [ ] Dashboard "Actions Requises" shows overdue tasks

### 2.8 — Plausible + Sentry
- [ ] src/lib/plausible.ts: initPlausible() + trackEvent() — no-op if env var missing
- [ ] src/lib/sentry.ts: initSentry() + ErrorBoundary — no-op if DSN missing
- [ ] Both initialised in main.tsx
- [ ] 5 Plausible events tracked: quote_created, contract_sent, invoice_paid, reminder_sent, signature_requested
- [ ] French error fallback on ErrorBoundary
- [ ] VITE_PLAUSIBLE_DOMAIN + VITE_SENTRY_DSN in .env.example

---

## CROSS-CUTTING CHECKS (apply to everything above)
- [ ] Zero TypeScript any violations — run tsc --noEmit and report any errors
- [ ] No hardcoded secrets or VITE_-prefixed write-permission keys
- [ ] All new Supabase tables have RLS enabled with at least select + insert + update + delete policies
- [ ] All UI text is in French
- [ ] vite build passes clean

---

## REPORT FORMAT (required)

### ✅ SOLID ITEMS
List each task/check that passes fully.

### ⚠️ PARTIAL ITEMS
For each: what exists, what is missing, estimated fix size (small/medium/large).

### ❌ MISSING ITEMS
For each: what needs to be built from scratch.

### 🔧 TECHNICAL DEBT
TypeScript errors, RLS gaps, security issues, naming inconsistencies — anything that
will cause problems in Phase 3 if not fixed now.

### 📍 RECOMMENDATION
Fix all ⚠️ and ❌ items before proceeding. List them in priority order with one sentence
on what needs to happen for each. Only mark Phase 2 closed when this section is empty.
```

---

## PROMPT 10 — PHASE 2 FIX · Close 3 audit gaps before Phase 3

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phase 2 audit identified 3 gaps and 2 housekeeping items. Fix all of them.
Do not build new features — only fix what is listed below.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/lib/gemini.ts — understand askGemini() and how VITE_GEMINI_API_KEY is used client-side
2. supabase/functions/generate-reminder/index.ts — mirror this exact pattern for the new clause function
3. src/components/contracts/ContractBlockEditor.tsx — find the askGemini() call to replace
4. src/pages/QuoteBuilderPage.tsx — understand quote data shape for FIRMA send
5. src/components/contracts/SendForSignatureModal.tsx + firma-signature Edge Function — reuse as-is
6. src/components/projects/ProjectDashboardModal.tsx — find where to add the Devis tab

State your fix plan in 4 bullet points, then proceed.

## FIX 1 — Move AI clause generation server-side (security)

The askGemini() call in ContractBlockEditor uses VITE_GEMINI_API_KEY — exposed in the JS bundle.

1. Create supabase/functions/generate-clause/index.ts:
   - Mirror generate-reminder exactly: POST, authenticated via Supabase JWT
   - Body: { description: string } — the user's plain-French clause description
   - Prompt to Gemini (gemini-2.0-flash):
     "Rédige une clause professionnelle pour un contrat freelance français basée sur : [description].
     Réponds uniquement avec le texte de la clause, sans titre, sans explication."
   - Returns: { clause: string }

2. In ContractBlockEditor.tsx:
   - Remove the askGemini() import
   - Replace with a fetch() call to /functions/v1/generate-clause
   - Keep identical UX: loading state, error state, preview card, insert on confirm

3. Do NOT delete VITE_GEMINI_API_KEY from .env yet — other features may still use it.
   Add a TODO comment in gemini.ts: "// TODO: rotate this key — clause generation moved server-side"

## FIX 2 — FIRMA signature available on quotes

QuoteBuilderPage has no "Envoyer pour signature" button. Quotes need the same send flow as contracts.

1. In QuoteBuilderPage.tsx (or quote row action menu — read existing structure first):
   - Add "Envoyer pour signature" button, visible when quote status is 'brouillon' or 'sent'
   - Reuse SendForSignatureModal exactly as-is — pass quote title, client contact_name, client email
   - On confirm: call the same firma-signature Edge Function used for contracts
     Pass document_type: 'quote' so the webhook can route the status update correctly

2. In supabase/functions/firma-webhook/index.ts:
   - Ensure webhook handles both document_type: 'quote' and 'contract'
   - Quote status updates go to quotes table, contract updates go to project_contracts table
   - If already handled: verify and add a comment confirming it, no code change needed

3. Blocked state: if client has no contact_name → same inline error as contracts:
   "Ajoutez le nom du signataire dans la fiche client avant d'envoyer"

## FIX 3 — Quote status visible to freelancer

Freelancer currently has no view showing all quotes with their status badges.

1. Add a "Devis" tab to ProjectDashboardModal (simplest path — no new route needed):
   - Tab label: "Devis"
   - List all quotes for the project: title, amount HT, DocumentStatusBadge, created_at
   - Each row: actions — Download PDF, Envoyer pour signature (from Fix 2), Archive
   - Empty state: "Aucun devis pour ce projet"

2. Apply DocumentStatusBadge to the existing quotes list in QuoteBuilderPage or
   wherever quotes are listed globally — if a global quotes list exists, add the badge there too.
   Read the existing structure first before deciding where to add it.

## HOUSEKEEPING (do these after the 3 fixes)

- Delete src/components/projects/ProjectKanban.tsx — confirmed unused, replaced by ProjectTaskList
- Add server.js and supabase/functions/chat-assistant/ to git tracking:
  Run: git add server.js supabase/functions/chat-assistant/
  Do not modify their content — just ensure they are tracked

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- tsc and vite build must pass clean after all fixes

## WHEN DONE
- List every file created or modified
- Confirm all 3 audit gaps are resolved
- Confirm tsc --noEmit → 0 errors and vite build passes
- State: Phase 2 is now fully closed
- Next task: Phase 3 — 3.1 cost calculator
```

---

*Prezta Roadmap v7 · March 2026 · prezta.fr*

## PROMPT 11 — PHASE 3 / TASK 3.1 + 3.2 · Cost calculator + Revenue dashboard

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1 and 2 are fully done. You are opening Phase 3 — L'Autonomie — with tasks 3.1 and 3.2.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/types/ — all existing type exports, follow naming conventions exactly
2. src/pages/QuoteBuilderPage.tsx — catalogue line item pattern to reuse in cost calculator
3. src/hooks/useDashboard.ts + src/pages/DashboardPage.tsx — existing KPI card and Recharts
   bar chart pattern to follow for the revenue dashboard
4. supabase/migrations/ — latest migration number to increment, and invoices table schema
   (revenue dashboard reads from invoices + clients)
5. package.json — confirm recharts is already installed

State your implementation plan in 4 bullet points, then proceed.

## 3.1 — Cost calculator (prix de revient)

A standalone calculator that helps freelancers price a job correctly before quoting.
No new Supabase table needed — stateful UI only, not persisted.

1. New page src/pages/CostCalculatorPage.tsx at route /calculateur:
   - Add "Calculateur" to AppLayout sidebar under a new "Outils" section group

2. Three input sections (all reactive — totals update on every keystroke):
   - Matériaux: rows of { description, quantity, unit_price } — add/remove rows inline
   - Main d'œuvre: rows of { description, hours, hourly_rate } — add/remove rows inline
   - Déplacements: rows of { description, km, rate_per_km } — add/remove rows inline
     Default rate_per_km: 0.50€ (barème kilométrique FR 2026)
   - Marge %: single input (0–100)

3. Sticky summary card (right column or bottom):
   - Coût matériaux HT
   - Coût main d'œuvre HT
   - Coût déplacements HT
   - Sous-total coût de revient HT
   - Marge appliquée (€)
   - Prix de vente conseillé HT (large, bold, brand color)
   - Prix de vente conseillé TTC (at 20% TVA)

4. Two action buttons:
   - "Exporter vers le catalogue" → creates a new product in products table using
     the HT price + a generated description; redirect to /catalogue on success
   - "Créer un devis" → navigate to /devis/nouveau passing the calculated price
     and description as route state to pre-fill QuoteBuilderPage

## 3.2 — Revenue dashboard

Dedicated analytics page reading exclusively from the existing invoices + clients tables.
Zero extra data entry. Zero new Supabase tables.

1. New page src/pages/RevenueDashboardPage.tsx at route /revenus:
   - Add "Revenus" to AppLayout sidebar under "Principal" section

2. Period filter (top bar): "Mois en cours" · "Trimestre" · "Année" · "12 derniers mois"
   All charts and KPIs react to this filter instantly.

3. KPI row — 4 cards (reuse existing mini-stat card style from DashboardPage):
   - CA de la période: sum of amount where status='paid' within period
   - En attente: sum where status='pending' or 'overdue' within period
   - Factures émises: count within period
   - Taux de recouvrement: paid count / total issued count (%), formatted as "X%"

4. Comparison row (below KPIs):
   - Compute same 4 KPIs for the prior equivalent period
   - Show delta per KPI: ↑ +18% in success color · ↓ -5% in danger color · — if no prior data

5. Charts (Recharts — follow existing bar chart pattern exactly):
   - Bar chart: CA mensuel (one bar per month within selected period, amount in €)
   - Horizontal bar chart: Top 5 clients par CA (client name on Y axis, amount on X axis)
     Read client name by joining invoices → clients table

6. Data hook src/hooks/useRevenueDashboard.ts:
   - Single hook, takes period filter as param
   - Returns: { kpis, previousKpis, monthlyRevenue, topClients, isLoading }
   - TanStack Query, staleTime: 5 minutes

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- No new Supabase tables — read invoices + clients only
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 3.3 document expiry alerts + 3.4 accounting ZIP export
```

## PROMPT 12 — PHASE 3 / TASK 3.3 + 3.4 · Document expiry alerts + Accounting ZIP export

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1 and 2 done. Phase 3 tasks 3.1 and 3.2 done. You are implementing tasks 3.3 and 3.4.

## BEFORE WRITING ANY CODE — READ FIRST:
1. supabase/migrations/ — latest migration number, and project_contracts + quotes table schemas
2. src/hooks/useDashboard.ts — existing alert/feed pattern to extend for expiry alerts
3. src/pages/DashboardPage.tsx — "Actions Requises" feed rendering to extend
4. src/lib/resend.ts + src/emails/ — existing email send pattern for expiry notifications
5. supabase/functions/ — existing Edge Function structure to mirror for the cron job
6. src/types/ — existing type exports, follow naming conventions

State your implementation plan in 4 bullet points, then proceed.

## 3.3 — Document expiry alerts

Contracts and NDAs can have an optional expiry date. Alert the freelancer at J-30 and J-7.

1. Schema — add to project_contracts table (new migration, RLS inherited):
   - expires_at TIMESTAMPTZ nullable
   - expiry_notified_30d BOOLEAN DEFAULT false
   - expiry_notified_7d BOOLEAN DEFAULT false

2. UI — expiry date field in contract editor/detail:
   - Optional date picker labelled "Date d'expiration (optionnel)"
   - Show inline if set: "Expire le [date]" with warning color if within 30 days
   - Show danger color and "⚠ Expire dans Xj" badge if within 7 days

3. Supabase cron function supabase/functions/check-document-expiry/index.ts:
   - Triggered daily (Supabase pg_cron: '0 8 * * *' — 8h00 UTC)
   - Query: project_contracts WHERE expires_at IS NOT NULL AND expires_at > now()
   - For each contract:
     * If expires_at <= now() + 30d AND expiry_notified_30d = false:
       send Resend email "Votre contrat [title] avec [client] expire dans 30 jours"
       set expiry_notified_30d = true
     * If expires_at <= now() + 7d AND expiry_notified_7d = false:
       send Resend email "⚠ Votre contrat [title] expire dans 7 jours"
       set expiry_notified_7d = true
   - Use service role key (server-side only)

4. In-app notification centre (header bell icon):
   - New component src/components/layout/NotificationBell.tsx
   - Query contracts expiring within 30 days for current user
   - Badge count on bell icon (shadcn Badge)
   - Dropdown list: "Contrat [title] — expire dans Xj" with link to project
   - "Tout marquer comme lu" button — dismisses via localStorage (no new table needed)
   - Wire into AppLayout.tsx header, replacing or alongside the existing header actions

## 3.4 — Accounting ZIP export

One click exports all documents for a period into a clean ZIP for the accountant.

1. New page src/pages/ExportComptableePage.tsx at route /export-comptable:
   - Add "Export comptable" to AppLayout sidebar under "Outils" section

2. UI — filter then export:
   - Period selector: year picker + optional month filter (default: current year)
   - Checkboxes for document types to include:
     ☑ Factures  ☑ Devis signés  ☑ Contrats  ☑ Registre CSV
   - "Générer l'export" button → triggers download

3. Vercel Edge Function api/export-comptable.ts:
   - POST, authenticated via Supabase JWT
   - Body: { year, month?: number, types: string[] }
   - Fetches matching PDFs from Supabase Storage by period + type
   - Builds ZIP using JSZip with this folder structure:
     /Factures/YYYY-MM-CLIENT-Facture-vN.pdf
     /Devis_signés/YYYY-MM-CLIENT-Devis-vN.pdf
     /Contrats/YYYY-MM-CLIENT-Contrat-[type]-vN.pdf
     /Registre.csv  (generated inline — invoices for period: number, client, amount HT,
                     amount TTC, status, date, due_date)
   - Returns ZIP as application/zip blob
   - Install jszip if not present

4. Client-side download:
   - On response: create object URL from blob → trigger browser download
   - Filename: Prezta-Export-Comptable-YYYY[-MM].zip
   - Loading state during generation, error toast on failure

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- Cron function and export function use service role key — never VITE_ prefix
- RLS on new columns (inherited from parent table policy is acceptable)
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 3.5 client portal
```

## PROMPT 13 — PHASE 3 / TASK 3.5 + 3.6 · Client portal + Auto French legal mentions

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1 and 2 done. Phase 3 tasks 3.1–3.4 done. You are implementing tasks 3.5 and 3.6.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/lib/legal-mentions.ts — existing legal mention logic to extend for 3.6
2. src/components/pdf/QuotePDFDocument.tsx + InvoicePDFDocument.tsx + ContractPDFDocument.tsx
   — how legal mentions are currently injected into PDFs
3. supabase/migrations/ — latest migration number, quotes + project_contracts + invoices schemas
4. src/types/quote.ts + src/types/contract.ts — token/share fields if any already exist
5. src/hooks/ — existing useClients, useProjects patterns to follow

State your implementation plan in 4 bullet points, then proceed.

## 3.5 — Client portal (light)

A public page accessible via unique token link — no client account required.
The client sees only their own documents for one project.

1. Schema — new migration:
   - Add portal_token UUID DEFAULT gen_random_uuid() to projects table
   - Add portal_expires_at TIMESTAMPTZ DEFAULT now() + interval '90 days' to projects table
   - Add portal_enabled BOOLEAN DEFAULT false to projects table
   - RLS: public SELECT on projects WHERE portal_enabled = true AND portal_expires_at > now()
     scoped to portal_token match — use Supabase anon key, no auth required
   - Same public RLS on quotes, project_contracts, invoices WHERE project_id matches

2. Portal page src/pages/ClientPortalPage.tsx at public route /portail/:token:
   - No auth required — accessible by anyone with the link
   - Fetch project by portal_token (anon Supabase client)
   - If not found or expired: full-page message "Ce lien est expiré ou invalide"
   - If valid: show read-only view:
     * Header: Prezta logo + "Documents de [project_name] — [client_name]"
     * Tabs: Devis · Contrats · Factures
     * Each tab: list of documents with title, date, DocumentStatusBadge, PDF download button
     * PDF download: generates signed Supabase Storage URL (60 min expiry)
   - No edit actions, no navigation, no sidebar — public-facing only
   - Style: clean white, brand colors, mobile responsive

3. Portal activation in project detail (ProjectDashboardModal or project settings):
   - Toggle "Activer le portail client" (shadcn Switch)
   - On enable: set portal_enabled = true, generate fresh portal_token + reset expires_at
   - Show generated link: "https://app.prezta.fr/portail/[token]" with copy button
   - Show expiry: "Lien valide jusqu'au [date]"
   - "Réinitialiser le lien" button — generates new token, invalidates old one
   - On disable: set portal_enabled = false

4. Read-tracking integration:
   - When client loads the portal page, call the existing track-quote-view Edge Function
     for any quote with status 'sent' — reuse 2.4b pixel pattern
   - No new tracking infrastructure needed

## 3.6 — Auto French legal mentions

Every PDF must automatically include the correct mandatory French legal mentions
based on the freelancer's legal status — zero manual input required.

1. Extend src/lib/legal-mentions.ts:
   Current file likely handles CGI 293B. Extend to cover all cases:

   generateLegalMentions(profile: Profile): LegalMentionsBlock

   Returns structured object with these fields:
   - tva_mention: string | null
     * auto-entrepreneur → "TVA non applicable, art. 293 B du CGI"
     * others with TVA number → "TVA intracommunautaire : FR[key][siret]"
   - rcs_mention: string | null
     * EURL/SASU/SAS/SARL → "RCS [ville] [numero_rcs]" — read from profile
     * auto-entrepreneur → null
   - late_payment: string (always present)
     → "Pénalités de retard : 3 fois le taux d'intérêt légal en vigueur.
        Indemnité forfaitaire pour frais de recouvrement : 40 €
        (Art. L441-10 et L441-11 du Code de commerce)"
   - payment_terms: string (always present)
     → "Escompte pour paiement anticipé : aucun"
   - legal_status_line: string
     * auto-entrepreneur → "Auto-entrepreneur — SIRET : [siret]"
     * others → "[forme_juridique] au capital de [capital]€ — SIRET : [siret]"

2. Apply generateLegalMentions() consistently across all 3 PDF documents:
   - QuotePDFDocument.tsx — footer section
   - InvoicePDFDocument.tsx — footer section
   - ContractPDFDocument.tsx — last page section titled "Mentions légales"
   Read each file first — if mentions are already partially present, extend rather than replace.
   Ensure no duplication of existing mention logic.

3. Profile completeness nudge:
   - If profile is missing rcs_number (required for société) or siret:
     show a yellow warning banner at the top of QuoteBuilderPage and InvoicesPage:
     "Complétez votre profil pour que les mentions légales soient correctes → [Compléter]"
   - Link goes to /parametres/profil
   - Dismissible per session (localStorage — no new table)

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- Portal page uses Supabase anon key only — never service role key client-side
- RLS on all new columns — portal access must be strictly scoped to token + enabled + not expired
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 3.7 storage limits + 3.8 route optimization
```

## PROMPT 14 — PHASE 3 / TASK 3.7 + 3.8 · Storage limits + Route optimization · CLOSES PHASE 3

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1 and 2 done. Phase 3 tasks 3.1–3.6 done. You are implementing 3.7 and 3.8 — the final
two tasks of Phase 3.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/hooks/useSubscription.ts — current plan detection (free vs pro) to gate storage limits
2. supabase/migrations/ — latest migration number, Supabase Storage bucket names in use
3. src/pages/PricingPage.tsx — existing upgrade nudge pattern to reuse
4. src/components/layout/AppLayout.tsx — where to surface the storage bar in profile/settings
5. src/pages/PlanningPage.tsx + src/hooks/ tasks-related hooks — existing planning data
   to extend for route optimization
6. package.json — check if @googlemaps/js-api-loader or similar is installed

State your implementation plan in 4 bullet points, then proceed.

## 3.7 — Storage limits by plan

Free plan: 1 GB · Pro plan: 10 GB · Enforce on upload, show usage in profile.

1. Supabase Storage usage calculation:
   - Create src/lib/storage.ts utility:
     getStorageUsage(userId): Promise<{ used: number, limit: number, percent: number }>
   - Query Supabase Storage API to sum file sizes across all buckets for the user
   - Limit from useSubscription: free → 1_073_741_824 bytes (1 GB), pro → 10_737_418_240 (10 GB)

2. Storage bar in settings/profile page (find existing ProfilePage or settings — read first):
   - Progress bar (shadcn Progress component) showing used / limit
   - Label: "X Mo utilisés sur Y Go"
   - Color: success < 60% · warning 60–80% · danger > 80%
   - At 80%+: yellow banner "Vous approchez de votre limite de stockage → Passer au Pro"

3. Upload blocking:
   - Before every PDF save to Supabase Storage (find all storage.upload() call sites):
     check current usage against limit
   - If would exceed: block the upload, show modal:
     "Limite de stockage atteinte (X Go sur Y Go utilisés).
      Passez au plan Pro pour obtenir 10 Go."
     with "Voir les offres" button → /pricing
   - Do not silently fail — always show the modal

4. Hook src/hooks/useStorageUsage.ts:
   - Returns { used, limit, percent, isNearLimit, isAtLimit, isLoading }
   - TanStack Query, staleTime: 2 minutes
   - Used by both the settings bar and the upload blocker

## 3.8 — Route optimization (planning + Google Maps + Gemini)

In the weekly planning view, a "Optimiser ma journée" button suggests the optimal
visit order for tasks that have client addresses, minimising travel time.

1. Prerequisites check (read PlanningPage.tsx first):
   - Tasks need a client address to be optimizable — tasks are linked to projects,
     projects to clients, clients have address fields
   - Only tasks with a linked client that has a non-empty address are candidates

2. "Optimiser ma journée" button on PlanningPage:
   - Visible when the selected day has 2+ tasks with addressable clients
   - On click: collect tasks for the selected day with client addresses
   - Show loading state: "Calcul des trajets en cours…"

3. Vercel Edge Function api/optimize-route.ts:
   - POST, authenticated via Supabase JWT
   - Body: { tasks: Array<{ id, title, clientName, address, currentOrder }> }
   - Step 1 — Google Maps Distance Matrix API:
     * Build matrix of travel times between all task addresses + user's home/office
       (read user address from profile)
     * Use GOOGLE_MAPS_API_KEY env var (server-side only, no VITE_ prefix)
     * Add GOOGLE_MAPS_API_KEY to .env.example
   - Step 2 — Gemini (gemini-2.0-flash):
     * Pass distance matrix + current task list to Gemini
     * Prompt: "Tu es un assistant de planification pour un freelance français.
       Voici les temps de trajet en minutes entre ces adresses : [matrix].
       Tâches du jour : [tasks]. Propose l'ordre de visite optimal pour minimiser
       les déplacements. Réponds en JSON : { optimizedOrder: string[], timeSaved: number,
       summary: string } où optimizedOrder est la liste des task IDs dans le nouvel ordre,
       timeSaved est le nombre de minutes économisées, summary est une phrase en français."
     * Parse JSON response strictly — if parse fails, return original order with error flag
   - Returns: { optimizedOrder, timeSaved, summary, error? }

4. Result display in PlanningPage:
   - Show Gemini summary in a blue info banner:
     ex: "Vous gagnez 45 min en voyant Dupont avant Martin."
   - "Appliquer" button → reorders tasks visually for the day (update due_date time or
     display order — read existing task structure to find best approach)
   - "Ignorer" button → dismisses banner, keeps original order
   - If timeSaved = 0 or error: "Votre planning est déjà optimal." — no reorder offered

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- GOOGLE_MAPS_API_KEY server-side only — never VITE_ prefix
- Gemini call server-side via Edge Function — never client-side
- RLS on any new data
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm Phase 3 is fully closed
- Next task: Phase 3 audit (same read-only checklist format as Phase 2 audit)
```

## PROMPT 15 — PHASE 3 / TASK 3.7a · Pricing page redesign (3 plans)

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1 and 2 done. Phase 3 tasks 3.1–3.6 done. You are replacing the existing PricingPage
with a complete 3-plan pricing page including annual toggle and à la carte signatures.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/pages/PricingPage.tsx — current implementation to replace entirely
2. src/hooks/useSubscription.ts — plan detection logic, Lemon Squeezy product/variant IDs
3. src/lib/ — any existing Lemon Squeezy checkout helper
4. src/components/layout/AppLayout.tsx — header/topbar to add trial countdown banner
5. .env.example — existing Lemon Squeezy env vars

State your implementation plan in 4 bullet points, then proceed.

## PLAN DEFINITIONS (hardcode these constants in src/lib/plans.ts)

```ts
export const PLANS = {
  trial:   { maxProjects: 3,  maxDocuments: 15,  storageBytes: 524_288_000,    firmaPerMonth: 0,  aiEnabled: false },
  starter: { maxProjects: 10, maxDocuments: 50,  storageBytes: 2_147_483_648,  firmaPerMonth: 3,  aiEnabled: false },
  pro:     { maxProjects: Infinity, maxDocuments: Infinity, storageBytes: 10_737_418_240, firmaPerMonth: Infinity, aiEnabled: true },
} as const
export type PlanKey = keyof typeof PLANS
```

## PRICING PAGE — src/pages/PricingPage.tsx (full replacement)

1. Annual/monthly toggle (shadcn Switch) at top:
   - Monthly: Starter 9€ · Pro 19€
   - Annual: Starter 7,20€/mois facturé 86,40€/an · Pro 15,20€/mois facturé 182,40€/an
   - Toggle persists in component state only

2. Three plan cards side by side (Gratuit · Starter · Pro):
   - Pro card: highlighted with brand border + "Recommandé" badge
   - Each card shows: plan name, price, billing note, feature list with ✅/❌/value
   - Feature list must match the PLANS TARIFAIRES table exactly (use the Quick Reference)
   - CTA buttons:
     * Gratuit: "Commencer l'essai gratuit" → /signup
     * Starter: "Choisir Starter" → triggers Lemon Squeezy checkout (monthly or annual variant)
     * Pro: "Choisir Pro" → triggers Lemon Squeezy checkout (monthly or annual variant)
     * If user already on that plan: button shows "Plan actuel" (disabled)

3. À la carte signatures section (below plan cards):
   - Small card: "Besoin de plus de signatures ? Achetez-les à l'unité."
   - "1 signature — 1€" with quantity selector (1–20)
   - "Acheter" button → Lemon Squeezy one-time purchase checkout
   - Only visible to Starter users (hide for trial and pro)

4. Lemon Squeezy checkout:
   - Read existing checkout pattern from useSubscription.ts / any LS helper
   - Add env vars to .env.example if missing:
     VITE_LS_STARTER_MONTHLY_VARIANT_ID=
     VITE_LS_STARTER_ANNUAL_VARIANT_ID=
     VITE_LS_PRO_MONTHLY_VARIANT_ID=
     VITE_LS_PRO_ANNUAL_VARIANT_ID=
     VITE_LS_SIGNATURE_PACK_VARIANT_ID=
   - Checkout opens in Lemon Squeezy overlay (JS embed) or redirect — follow existing pattern

5. Trial countdown banner in AppLayout.tsx:
   - If user is on trial: yellow banner below topbar
     "Votre essai gratuit expire dans X jours — Choisir un plan →"
   - Read trial_ends_at from profiles or subscriptions table
   - Hide when plan is starter or pro
   - Link → /pricing

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 3.7b plan enforcement
```

---

## PROMPT 16 — PHASE 3 / TASK 3.7b · Plan enforcement across all features

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Prompt 15 done — plans.ts, PricingPage, and trial banner exist.
You are now enforcing plan limits across every feature in the codebase.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/lib/plans.ts — PLANS constants just created (trial/starter/pro limits)
2. src/hooks/useSubscription.ts — current plan key returned for the user
3. supabase/migrations/ — latest number, quotes + project_contracts + invoices schemas
4. src/pages/QuoteBuilderPage.tsx + InvoicesPage.tsx + ProjectWizard.tsx — document/project
   creation entry points where limits must be checked
5. src/components/contracts/ContractBlockEditor.tsx — AI clause gate
6. src/components/contracts/SendForSignatureModal.tsx — FIRMA gate
7. src/hooks/useDashboard.ts — to add document count to existing data

State your implementation plan in 4 bullet points, then proceed.

## 1 — Supabase View: active document count

Create migration — new Supabase View `user_active_document_counts`:
```sql
CREATE OR REPLACE VIEW user_active_document_counts AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE source = 'quote')    AS quote_count,
  COUNT(*) FILTER (WHERE source = 'invoice')  AS invoice_count,
  COUNT(*) FILTER (WHERE source = 'contract') AS contract_count,
  COUNT(*) AS total
FROM (
  SELECT user_id, 'quote'    AS source FROM quotes           WHERE status != 'archived'
  UNION ALL
  SELECT user_id, 'invoice'  AS source FROM invoices         WHERE status != 'archived'
  UNION ALL
  SELECT user_id, 'contract' AS source FROM project_contracts WHERE status != 'archived'
) docs
GROUP BY user_id;
```
RLS: user can only SELECT their own row (WHERE user_id = auth.uid()).

## 2 — Hook: usePlanLimits

Create src/hooks/usePlanLimits.ts:
- Reads current plan from useSubscription()
- Reads active document count from the View above
- Reads storage usage from existing useStorageUsage() (created in 3.7a or create now)
- Reads firma_signatures_used this month from subscriptions table
- Returns:
```ts
{
  plan: PlanKey
  canCreateDocument: boolean   // total < PLANS[plan].maxDocuments
  canCreateProject: boolean    // projectCount < PLANS[plan].maxProjects
  canUseFirma: boolean         // firmaPerMonth = Infinity OR used < limit
  canUseAI: boolean            // PLANS[plan].aiEnabled
  documentsUsed: number
  documentsLimit: number
  firmaUsed: number
  firmaLimit: number
  isNearDocumentLimit: boolean // used >= limit * 0.8
}
```

## 3 — Document creation gates

At every document creation entry point — read files first, add gate after existing validation:

**canCreateDocument = false:**
- Block the "Nouveau devis" / "Nouvelle facture" / "Nouveau contrat" action
- Create the document with status = 'brouillon' BUT set a new column `send_blocked: true`
- Show modal: "Vous avez atteint X documents actifs (limite {plan}: Y).
  Archivez un document existant ou passez au plan supérieur."
  Buttons: "Voir mes documents" · "Passer au Pro" → /pricing

**isNearDocumentLimit = true (≥80%):**
- Show yellow inline banner on QuoteBuilderPage + InvoicesPage:
  "X documents actifs sur Y — Pensez à archiver vos anciens documents."

## 4 — Project creation gate

In ProjectWizard.tsx step 1:
- If canCreateProject = false: disable "Créer le projet" button
- Show inline: "Vous avez atteint X projets actifs (limite {plan}: Y).
  Passez au plan supérieur pour créer plus de projets." + link /pricing

## 5 — FIRMA signature gate

In SendForSignatureModal.tsx:
- If canUseFirma = false: replace "Confirmer l'envoi" with disabled button
- Show: "Vous avez utilisé vos X signatures ce mois-ci.
  Achetez des signatures supplémentaires (1€/signature) ou passez au Pro."
  Buttons: "Acheter des signatures" → /pricing#signatures · "Passer au Pro" → /pricing
- Update firma_signatures_used in subscriptions table after each successful send

## 6 — AI features gate

In these exact components — add gate before the AI call:
- ContractBlockEditor.tsx (clause generator): if !canUseAI → replace AI button with
  locked version showing 🔒 "Fonctionnalité Pro — Passer au Pro" → /pricing
- ReminderPreviewModal.tsx (smart reminders): if !canUseAI → skip Gemini call,
  show template text only with banner "Améliorez avec l'IA en passant au Pro"
- PlanningPage.tsx (route optimization): if !canUseAI → hide "Optimiser ma journée" button
- AiCatalogGenerator.tsx (onboarding catalogue): if !canUseAI → hide generator entirely,
  show "Disponible avec le plan Pro" card instead

## 7 — Archive action

Every document list (quotes, invoices, contracts) must have an explicit "Archiver" action:
- Check each list view — if archive action already exists: verify it sets status='archived'
- If missing: add "Archiver" to the row dropdown menu (shadcn DropdownMenuItem)
- On archive: status → 'archived', document count decreases immediately (View auto-updates)
- Archived documents: still visible in a collapsible "Documents archivés" section at bottom
  of each list, greyed out, with "Désarchiver" option

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- RLS on new View — user sees only own row
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points covering: document limit block, FIRMA gate, AI gate
- Confirm next task: 3.8 route optimization
```

## PROMPT 16b — FIX · Aligner plans.ts + PricingPage sur les tarifs validés

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Prompt 16 implemented plan gates but used incorrect plan constants.
The real validated pricing structure must now be applied everywhere.
Do not build new features — only align existing code to the correct plan definitions.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/lib/plans.ts — current constants to replace entirely
2. src/pages/PricingPage.tsx — current pricing page to verify/update
3. src/hooks/usePlanLimits.ts — check it references plans.ts correctly
4. supabase/migrations/00027_plan_limits.sql — check plan key names match
5. Every file that imports from plans.ts — grep for "from.*plans" to find all consumers

State your fix plan in 3 bullet points, then proceed.

## FIX 1 — Replace plans.ts with correct validated constants

Replace src/lib/plans.ts entirely with:

```ts
export const PLANS = {
  trial: {
    maxProjects: 3,
    maxDocuments: 15,
    storageBytes: 524_288_000,       // 500 Mo
    firmaPerMonth: 0,
    aiEnabled: false,
    price: { monthly: 0, annual: 0 },
    label: 'Gratuit',
    trialDays: 14,
  },
  starter: {
    maxProjects: 10,
    maxDocuments: 50,
    storageBytes: 2_147_483_648,     // 2 Go
    firmaPerMonth: 3,
    aiEnabled: false,
    price: { monthly: 9, annual: 7.20 },
    annualTotal: 86.40,
    label: 'Starter',
    trialDays: 0,
  },
  pro: {
    maxProjects: Infinity,
    maxDocuments: Infinity,
    storageBytes: 10_737_418_240,    // 10 Go
    firmaPerMonth: Infinity,
    aiEnabled: true,
    price: { monthly: 19, annual: 15.20 },
    annualTotal: 182.40,
    label: 'Pro',
    trialDays: 0,
  },
} as const

export type PlanKey = keyof typeof PLANS

// Document count rule: active = status !== 'archivé'
// Versioning (v1→v2) = 1 slot. Archive frees 1 slot immediately.
// At limit: document created as brouillon with send_blocked = true
```

Verify usePlanLimits.ts still compiles after this change — fix any type errors.

## FIX 2 — Update PricingPage.tsx to match validated plans

Read the current PricingPage.tsx and update ONLY the values that are wrong:

Plan cards must show exactly:
- **Gratuit (14 jours)** — 0€ — 3 projets · 15 documents actifs · 500 Mo · 0 signature FIRMA · pas d'IA
- **Starter** — 9€/mois (ou 7,20€/mois · 86,40€/an) — 10 projets · 50 documents actifs · 2 Go · 3 signatures FIRMA/mois + 1€/extra · pas d'IA
- **Pro** — 19€/mois (ou 15,20€/mois · 182,40€/an) — illimité · 10 Go · signatures illimitées · IA complète

Feature list in each card must match the PLANS TARIFAIRES table in the Quick Reference exactly.
Do not redesign the page — only fix the values and feature list.

Annual toggle must show:
- Starter: "9€/mois" ↔ "7,20€/mois · facturé 86,40€/an"
- Pro: "19€/mois" ↔ "15,20€/mois · facturé 182,40€/an"

À la carte signatures section (below cards, Starter users only):
- If missing: add it — "Besoin de plus de signatures ? 1€ / signature supplémentaire"
  with quantity selector (1–20) and "Acheter" → Lemon Squeezy one-time purchase

## FIX 3 — Trial countdown banner in AppLayout

If the trial banner added in Prompt 15 is missing or not wired:
- Read AppLayout.tsx — find where to add the banner (below topbar, above main content)
- Read profiles or subscriptions table schema — find trial_ends_at or created_at
- Calculate days remaining: trial = 14 days from account created_at
- Show yellow banner if plan = 'trial' AND days remaining > 0:
  "Votre essai gratuit expire dans {X} jour(s) — Choisir un plan →"  link → /pricing
- Show red banner if plan = 'trial' AND days remaining ≤ 0:
  "Votre essai gratuit a expiré — Choisissez un plan pour continuer →"  link → /pricing
- Hide entirely if plan = 'starter' or 'pro'

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- tsc and vite build must pass clean after all fixes

## WHEN DONE
- List every file modified
- Confirm plans.ts constants match exactly the validated table
- Confirm PricingPage shows correct prices and feature list
- Confirm tsc --noEmit → 0 errors
- Next task: 3.8 route optimization
```

## PROMPT 16c — FIX · Landing page + PricingPage affichent encore l'ancien plan unique

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
The pricing section still shows the old single plan "Prezta Pro 14€".
There are TWO places that display pricing — both must be updated.
Do not touch any other code.

## BEFORE WRITING ANY CODE — READ FIRST:
1. Search for "14" and "Pro" and "Membre Prezta" across ALL src/ files to find every
   location where pricing is displayed — grep -r "14€\|Membre Prezta\|L'unique abonnement\|abonnement" src/
2. src/pages/LandingPage.tsx (or wherever the public landing page lives) — this is almost
   certainly where the screenshot comes from, NOT PricingPage.tsx
3. src/pages/PricingPage.tsx — verify its current state after Prompt 16b
4. src/lib/plans.ts — read the validated constants to use

State exactly which files contain hardcoded pricing, then proceed.

## FIX — Replace every pricing section with the 3-plan layout

For EACH file that contains hardcoded pricing (landing page AND pricing page):

Replace the pricing section entirely with 3 plan cards:

### Card 1 — Gratuit (14 jours)
- Titre: "Gratuit"
- Prix: "0€" + sous-titre "14 jours d'essai · sans carte bancaire"
- Features: 3 projets · 15 documents actifs · 500 Mo · Devis + factures + contrats PDF ·
  Templates contrats FR · Registre facturation · Gestion clients + SIRENE · Tâches + planning
- CTA: "Commencer gratuitement" → /signup

### Card 2 — Starter (highlighted as border, NOT "Recommandé")
- Titre: "Starter"
- Prix mensuel: "9€/mois" · Prix annuel: "7,20€/mois · facturé 86,40€/an"
- Features: Tout Gratuit + 10 projets · 50 documents actifs · 2 Go stockage ·
  3 signatures FIRMA/mois · Signatures supplémentaires 1€/unité
- CTA: "Choisir Starter" → /signup ou checkout LS

### Card 3 — Pro (highlighted with brand border + badge "Recommandé")
- Titre: "Pro"
- Prix mensuel: "19€/mois" · Prix annuel: "15,20€/mois · facturé 182,40€/an"
- Features: Tout Starter + Projets illimités · Documents illimités · 10 Go ·
  Signatures FIRMA illimitées · IA complète (clauses, relances, trajets) ·
  Portail client · Export comptable ZIP · Alertes expiration · Tracking lecture devis ·
  Dashboard revenus · Support prioritaire
- CTA: "Choisir Pro" → /signup ou checkout LS

### Annual toggle
- shadcn Switch above the cards: "Mensuel" ↔ "Annuel (−20%)"
- Switching updates the price displayed on Starter and Pro cards
- Gratuit card never changes

### Remove entirely
- Any mention of "L'unique abonnement", "Membre Prezta", "14€", single-plan layout
- These must not appear anywhere in the codebase after this fix

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- Mobile responsive — cards stack vertically on small screens
- tsc and vite build must pass clean

## WHEN DONE
- List every file modified
- Confirm "14€" and "L'unique abonnement" no longer appear anywhere in src/
- 3 manual test points
- Next task: 3.8 route optimization
```

## PROMPT DEBUG-01 — Page bloquée sur "Chargement" après login

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
CRITICAL BUG: After login the app stays locked on a loading screen and never navigates to /dashboard.
Do not build anything. Diagnose and fix only.

## BEFORE WRITING ANY CODE — READ FIRST (in this exact order):
1. src/main.tsx — root render, Sentry.ErrorBoundary, providers order
2. src/contexts/AuthContext.tsx — loading state logic, how isLoading is set to false
3. src/components/auth/ProtectedRoute.tsx — how it reads isLoading + user, what it renders during load
4. src/App.tsx or src/router.tsx — route definitions, which component wraps which
5. src/hooks/useSubscription.ts — does it block rendering while fetching plan?
6. src/hooks/usePlanLimits.ts — does it block rendering while fetching limits?
7. src/components/layout/AppLayout.tsx — trial banner logic, any suspense or loading gate

For each file: identify any condition that could cause an infinite loading state.

## LIKELY ROOT CAUSES — check these first:

1. AuthContext isLoading never set to false:
   - onAuthStateChange callback may not be firing in all cases
   - Session check (supabase.auth.getSession) may be throwing silently
   - Fix: ensure isLoading = false is called in BOTH the resolved and error branches

2. ProtectedRoute rendering null or spinner forever:
   - If isLoading = true and the loading state has no timeout fallback → infinite spinner
   - If user = null after load completes but redirect to /login is not triggered → blank screen
   - Fix: add explicit else branch — if (!isLoading && !user) navigate('/login')

3. useSubscription or usePlanLimits blocking the render tree:
   - These hooks were added in Prompts 15/16 — they may suspend or return isLoading=true
     that AppLayout waits on before rendering children
   - Fix: ensure these hooks have a safe default state (plan='trial', all limits false)
     that renders immediately, data fills in after fetch

4. Trial banner logic in AppLayout crashing:
   - If trial_ends_at or created_at is missing from profiles → date calculation throws
   - Fix: wrap banner calculation in try/catch or null-check before computing days remaining

5. Sentry.ErrorBoundary swallowing the error silently:
   - The French error fallback card may be showing but below the loading spinner z-index
   - Fix: check browser console for any React errors being caught by ErrorBoundary

## DIAGNOSTIC STEPS — run these and report findings:

1. Open browser DevTools → Console tab
   - Are there any errors or warnings? Copy them exactly.

2. Open DevTools → Network tab → filter by "supabase"
   - Is getSession or onAuthStateChange request completing?
   - Is there a request stuck in "pending"?

3. Add temporary console.log to AuthContext:
   - Log every state transition: "getSession called", "session result: X", "isLoading set to false"
   - Log the exact value of isLoading and user at each render

4. Check if the issue is plan-related:
   - Temporarily hardcode isLoading=false in AuthContext and see if the app renders
   - If yes: the bug is in AuthContext session detection
   - If no: the bug is downstream (useSubscription, usePlanLimits, AppLayout)

## FIX REQUIREMENTS:
- Minimal change — fix only what is broken, no refactor
- isLoading must always resolve to false within 3 seconds maximum
   Add a safety timeout: setTimeout(() => setIsLoading(false), 3000) as fallback
- ProtectedRoute must always either render children OR redirect — never stay blank
- All hooks must return safe defaults synchronously, fetch async
- Remove any temporary console.logs before finishing

## CONSTRAINTS
- TypeScript strict — zero any
- Do not change any UI, routing logic, or feature code unrelated to the loading bug
- tsc and vite build must pass clean after fix

## WHEN DONE
- State the root cause in 1 sentence
- List every file modified
- Confirm the fix: login → app loads → /dashboard renders correctly
- Next task: resume 3.8 route optimization
```

## PROMPT 17 — PHASE 3 AUDIT + PHASE 3 / TASK 3.8 · Route optimization · CLOSES PHASE 3

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1 and 2 fully done. Phase 3 tasks 3.1–3.7 done.
This prompt does two things in order: (A) a read-only audit of Phase 3, then (B) implements 3.8.

━━━ PART A — PHASE 3 AUDIT (read-only, no code changes) ━━━

Before implementing 3.8, verify every Phase 3 task. Read files, report verdicts only.

✅ SOLID — fully implemented, no gaps
⚠️ PARTIAL — exists but something is missing
❌ MISSING — not implemented at all

CHECKLIST:

### 3.1 — Cost calculator
- [ ] /calculateur route exists and renders CostCalculatorPage
- [ ] 3 input sections: Matériaux, Main d'œuvre, Déplacements (add/remove rows)
- [ ] Marge % input, live summary card with prix de vente HT + TTC
- [ ] "Exporter vers le catalogue" → creates product in products table
- [ ] "Créer un devis" → navigates to quote builder with prefilled state

### 3.2 — Revenue dashboard
- [ ] /revenus route exists and renders RevenueDashboardPage
- [ ] Period filter: Mois en cours · Trimestre · Année · 12 derniers mois
- [ ] 4 KPI cards: CA, En attente, Factures émises, Taux de recouvrement
- [ ] vs période précédente delta (↑/↓) per KPI
- [ ] Recharts bar chart: CA mensuel
- [ ] Recharts horizontal bar: Top 5 clients
- [ ] useRevenueDashboard hook with TanStack Query staleTime 5 min

### 3.3 — Document expiry alerts
- [ ] expires_at + expiry_notified_30d + expiry_notified_7d on project_contracts (migration)
- [ ] Optional date picker in contract editor
- [ ] Warning/danger badge when within 30/7 days
- [ ] Supabase cron function check-document-expiry runs daily
- [ ] Resend emails at J-30 and J-7
- [ ] NotificationBell in AppLayout header with badge count + dropdown

### 3.4 — Accounting ZIP export
- [ ] /export-comptable route exists
- [ ] Year + month filter, document type checkboxes
- [ ] Vercel Edge Function api/export-comptable.ts builds ZIP via JSZip
- [ ] Folder structure: /Factures /Devis_signés /Contrats /Registre.csv
- [ ] Browser download triggered client-side

### 3.5 — Client portal
- [ ] portal_token + portal_expires_at + portal_enabled on projects (migration)
- [ ] Public route /portail/:token — no auth required
- [ ] Expired/invalid token → error message
- [ ] 3 tabs: Devis · Contrats · Factures with DocumentStatusBadge + PDF download
- [ ] Portal activation toggle in project detail with copy link + reset link
- [ ] Anon RLS scoped to token + enabled + not expired

### 3.6 — Auto French legal mentions
- [ ] generateLegalMentions() covers all statuses: auto-entrepreneur, EURL/SASU/SAS/SARL
- [ ] tva_mention, rcs_mention, late_payment, payment_terms, legal_status_line all returned
- [ ] Applied to QuotePDFDocument, InvoicePDFDocument, ContractPDFDocument
- [ ] Profile completeness warning banner on QuoteBuilderPage + InvoicesPage

### 3.7a — Pricing page
- [ ] 3 plan cards: Gratuit (0€/14j) · Starter (9€) · Pro (19€)
- [ ] Annual toggle: Starter 7,20€ · Pro 15,20€
- [ ] Feature list matches validated PLANS TARIFAIRES table exactly
- [ ] No mention of "14€" or "L'unique abonnement" anywhere in src/
- [ ] À la carte signatures section visible for Starter users
- [ ] Trial countdown banner in AppLayout (yellow < expiry, red after)

### 3.7b — Plan enforcement
- [ ] src/lib/plans.ts has correct constants (trial:15docs/3proj, starter:50/10, pro:∞)
- [ ] user_active_document_counts View exists with security_invoker
- [ ] usePlanLimits returns all 9 gate flags
- [ ] Document creation blocked at limit → brouillon non envoyable + modal
- [ ] Project creation blocked at limit → wizard disabled + message
- [ ] FIRMA gate in SendForSignatureModal → upgrade screen at limit
- [ ] AI gate on: clause generator, reminders, route optimization, catalogue generator
- [ ] Archive action on all document lists + "Documents archivés" collapsible section

### CROSS-CUTTING
- [ ] tsc --noEmit → 0 errors
- [ ] vite build passes clean
- [ ] All UI text in French
- [ ] Login → /dashboard loads without getting stuck on "Chargement"

REPORT FORMAT:
### ✅ SOLID · ### ⚠️ PARTIAL (what/missing/size) · ### ❌ MISSING · ### 🔧 TECH DEBT
### 📍 ITEMS TO FIX AFTER 3.8 (list only — do not fix now, proceed to Part B)

━━━ PART B — IMPLEMENT 3.8 (after audit report) ━━━

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/pages/PlanningPage.tsx — existing weekly grid, task structure, day selection
2. src/hooks/ — task-related hooks, how tasks link to projects → clients → addresses
3. src/lib/plans.ts — confirm canUseAI gate for pro only
4. src/hooks/usePlanLimits.ts — canUseAI flag already wired to PlanningPage
5. supabase/functions/ — latest Edge Function pattern to mirror
6. .env.example — confirm GOOGLE_MAPS_API_KEY entry exists or add it

State your implementation plan in 4 bullet points, then proceed.

## 3.8 — Route optimization (Google Maps Distance Matrix + Gemini)

"Optimiser ma journée" button on the weekly planning view — Pro only.

1. Data preparation in PlanningPage.tsx:
   - Collect all tasks for the selected day that have a linked project → client with a
     non-empty address field
   - Minimum 2 addressable tasks required — hide button otherwise
   - If canUseAI = false: button locked with 🔒 tooltip "Fonctionnalité Pro"
   - If canUseAI = true: button "✦ Optimiser ma journée" active

2. Vercel Edge Function api/optimize-route.ts:
   - POST, authenticated via Supabase JWT
   - Body: { tasks: Array<{ id: string, title: string, clientName: string, address: string }>, userAddress: string }
   - Read userAddress from profiles table (user's own address for start/end point)
   - Step 1 — Google Maps Distance Matrix API:
     * origins + destinations = all addresses (user address + all client addresses)
     * mode: driving
     * language: fr
     * Use GOOGLE_MAPS_API_KEY env var — server-side only, never VITE_ prefix
     * Extract travel time in minutes between every pair
   - Step 2 — Gemini (gemini-2.0-flash):
     * System: "Tu es un assistant de planification pour freelances français."
     * User: "Voici les temps de trajet en minutes entre ces adresses : [matrix JSON].
       Tâches du jour dans l'ordre actuel : [tasks JSON].
       Adresse de départ : [userAddress].
       Propose l'ordre de visite optimal pour minimiser le temps total de déplacement.
       Réponds UNIQUEMENT en JSON valide :
       { \"optimizedOrder\": [\"taskId1\",\"taskId2\",...], \"timeSaved\": number, \"summary\": \"phrase en français\" }
       Aucun texte avant ou après le JSON."
     * Parse JSON strictly — if parse fails → return { error: "parse_failed", originalOrder: task ids }
   - Returns: { optimizedOrder, timeSaved, summary } or { error, originalOrder }
   - Add GOOGLE_MAPS_API_KEY to .env.example if missing

3. Result UI in PlanningPage.tsx:
   - Loading state: spinner + "Calcul des trajets en cours…"
   - On success (timeSaved > 0):
     * Blue info banner: summary text from Gemini
       ex: "Vous gagnez 45 min en voyant Dupont avant Martin."
     * "Appliquer" button → reorders tasks visually for that day
       (update a local display_order state — do not persist to DB unless tasks have an order column)
     * "Ignorer" button → dismisses banner
   - On success (timeSaved = 0):
     * Green banner: "Votre planning est déjà optimal pour aujourd'hui."
   - On error:
     * Amber banner: "Impossible d'optimiser le trajet. Vérifiez les adresses de vos clients."

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- GOOGLE_MAPS_API_KEY server-side only — never VITE_ prefix
- Gemini call server-side via Edge Function only
- Graceful degradation if Maps or Gemini fails — never crash the planning page
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm Phase 3 is fully closed (pending any ⚠️ items from Part A)
- Next task: Phase 4 — 4.1 auto business analytics
```

## PROMPT 18 — PHASE 4 / TASK 4.1 + 4.2 · Auto business analytics + Market rate benchmark

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1, 2, and 3 are fully done. You are opening Phase 4 — L'Intelligence — with tasks 4.1 and 4.2.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/pages/RevenueDashboardPage.tsx + src/hooks/useRevenueDashboard.ts — existing analytics
   patterns and Recharts usage to reuse and extend, do not duplicate
2. src/types/ — Quote, Invoice, Contract, Client type definitions
3. supabase/migrations/ — latest migration number, quotes + invoices + clients schemas
4. src/lib/plans.ts — confirm canUseAI = Pro only (4.2 is AI-powered, Pro gate required)
5. src/hooks/usePlanLimits.ts — canUseAI flag to gate 4.2
6. src/components/ui/ — existing card, badge, stat components to reuse

State your implementation plan in 4 bullet points, then proceed.

## 4.1 — Auto business analytics

Automatic KPIs calculated from existing data — no extra input required.
Only meaningful after 3+ months of data. Show placeholder state if insufficient history.

1. New section in RevenueDashboardPage.tsx — "Analyse de votre activité" tab or section
   (do not create a new page — extend the existing revenue dashboard):
   - Add a tab "Analyse" alongside existing revenue view

2. Metrics to compute (all from existing invoices + quotes + project_contracts tables):

   **Taux d'acceptation des devis**
   - accepted quotes / total sent quotes (status='accepted' / status IN ('sent','lu','accepted','rejected'))
   - Display: percentage + trend vs prior 3 months
   - Threshold: < 50% → amber warning "Votre taux d'acceptation est faible"

   **Délai moyen de signature**
   - Average days between quote sent_at and status change to 'accepted'
   - Read from status_history jsonb — find sent and accepted timestamps
   - Display: "X jours en moyenne"

   **Délai moyen de paiement**
   - Average days between invoice created_at and status change to 'paid'
   - Display: "X jours en moyenne" + flag if > 30j

   **Top 3 clients par CA**
   - Sum paid invoices per client, rank top 3
   - Display: client name + amount + % of total CA

   **Clients qui paient en retard**
   - Clients with average payment delay > 30 days across all their invoices
   - Display: list with client name + average delay in days + "Relancer" button
     (opens existing ReminderPreviewModal)

   **Mois creux détectés**
   - Months in the last 12 where CA < 50% of the 12-month average
   - Display: "Vos mois creux : juin, juillet, août" — only shown if 6+ months of data

3. Data hook src/hooks/useBusinessAnalytics.ts:
   - All queries in one hook
   - Returns: { acceptanceRate, avgSignDelay, avgPayDelay, topClients,
     latePayerClients, quietMonths, hasEnoughData, isLoading }
   - hasEnoughData = user has invoices spanning at least 3 months
   - If !hasEnoughData: show placeholder card "Ces analyses seront disponibles après
     3 mois d'utilisation. Continuez à enregistrer vos devis et factures."
   - TanStack Query, staleTime: 10 minutes

## 4.2 — Market rate benchmark (Gemini — Pro only)

"Benchmark" button on each product in the catalogue — compares the freelancer's
price to the French market for that service type.

1. Gate: canUseAI = false → show 🔒 locked button with "Fonctionnalité Pro" tooltip

2. "Benchmark marché" button on each product row in CataloguePage.tsx:
   - Opens BenchmarkModal (new component src/components/catalogue/BenchmarkModal.tsx)
   - Shows: product name, current price HT, unit

3. Supabase Edge Function supabase/functions/benchmark-rate/index.ts:
   - POST, authenticated via Supabase JWT
   - Body: { productName: string, unit: string, priceHT: number, userMetier: string }
     (read userMetier from profiles table — the freelancer's activity type)
   - Gemini prompt (gemini-2.0-flash):
     "Tu es un expert des tarifs freelances en France en 2026.
     Un freelance de type '[userMetier]' facture '[productName]' à [priceHT]€ HT / [unit].
     Compare ce tarif au marché français 2026 pour ce type de prestation.
     Réponds UNIQUEMENT en JSON valide :
     {
       \"verdict\": \"sous_marche\" | \"dans_la_norme\" | \"premium\",
       \"marketMin\": number,
       \"marketMax\": number,
       \"marketMedian\": number,
       \"advice\": \"une phrase actionnable en français\",
       \"confidence\": \"faible\" | \"moyenne\" | \"élevée\"
     }
     Aucun texte avant ou après le JSON."
   - Parse strictly — return error if parse fails

4. BenchmarkModal result display:
   - Verdict badge:
     * sous_marche → danger "Vous êtes sous le marché"
     * dans_la_norme → success "Vous êtes dans la norme"
     * premium → brand "Vous êtes en tarif premium"
   - Range bar: visual showing marketMin–marketMax with user's price marked
   - Median: "Médiane marché : Xk€ / [unit]"
   - Advice: italic sentence below the bar
   - Confidence: small muted text "Données : [confidence]"
   - "Mettre à jour mon tarif" button → opens product edit modal prefilled
   - Loading state during Gemini call, error state if call fails

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- 4.2 Gemini call server-side via Edge Function only — never client-side
- 4.2 gated behind canUseAI (Pro plan only)
- 4.1 visible to all plans — data is from their own records, no AI
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm next task: 4.3 seasonality detection + 4.4 Factur-X
```

---

## PROMPT 19 — PHASE 4 / TASK 4.3 + 4.4 · Seasonality detection + Factur-X · CLOSES PHASE 4

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1, 2, 3 done. Phase 4 tasks 4.1 and 4.2 done. You are implementing 4.3 and 4.4 —
the final two tasks of Phase 4.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/hooks/useBusinessAnalytics.ts — quietMonths logic already computed, reuse it
2. supabase/functions/ — existing cron pattern from check-document-expiry to mirror for 4.3
3. src/lib/resend.ts + src/emails/ — existing email send pattern for seasonality alert
4. src/components/pdf/InvoicePDFDocument.tsx — PDF structure to extend for Factur-X
5. supabase/migrations/ — latest migration number, invoices + profiles schemas
6. package.json — check if pdf-lib is installed

State your implementation plan in 4 bullet points, then proceed.

## 4.3 — Seasonality detection

Proactive notification when a historically slow month is approaching.
Requires 12+ months of invoice data. Max 1 alert per month. No dashboard needed — just a
timely nudge by email and in-app.

1. Supabase cron function supabase/functions/check-seasonality/index.ts:
   - Schedule: '0 9 1 * *' — runs at 9h00 on the 1st of each month
   - For each user with 12+ months of invoice data:
     * Calculate average monthly CA over the last 12 months
     * Identify months where CA < 60% of the 12-month average (slow months)
     * If next month is a detected slow month AND no seasonality alert sent this month:
       → Send Resend email + in-app notification
       → Set last_seasonality_alert_sent_at = now() on profiles table
   - Use service role key — server-side only

2. Migration — add to profiles table:
   - last_seasonality_alert_sent_at TIMESTAMPTZ nullable
   - seasonality_enabled BOOLEAN DEFAULT true (user can opt out)

3. Resend email content (French):
   - Subject: "Prezta · Votre mois de [month] est historiquement calme"
   - Body: "D'après vos données des 12 derniers mois, [month] est généralement
     votre mois le plus creux (CA moyen : X€ vs moyenne annuelle : Y€).
     C'est le bon moment pour prospecter de nouveaux clients ou relancer
     vos contacts inactifs."
   - CTA button: "Voir mon analyse d'activité" → /revenus#analyse

4. In-app: surface in the existing NotificationBell (from 3.3):
   - Same message as email, one notification per detection
   - Dismissible — mark as read in localStorage

5. Settings toggle in ProfilePage or /parametres:
   - "Recevoir les alertes de saisonnalité" Switch (shadcn)
   - Updates seasonality_enabled on profiles table

## 4.4 — Factur-X e-invoicing (PDF hybride + XML EN16931)

Factur-X = standard PDF with embedded ZUGFeRD XML. The client receives a normal
readable PDF that also contains structured machine-readable data.
Required for French B2B e-invoicing compliance (obligation FR 2026).
Pro plan only — gated behind canUseAI? No — this is a compliance feature, gate behind
plan = 'pro' directly from useSubscription.

1. New utility src/lib/facturx.ts:
   - generateFacturXXML(invoice: Invoice, profile: Profile, client: Client): string
   - Generates a ZUGFeRD EN16931 compliant XML string with these fields:
     * BuyerReference, SellerTradeParty (profile SIRET, name, address)
     * BuyerTradeParty (client name, address, TVA if present)
     * InvoiceTypeCode: 380 (commercial invoice)
     * IssueDateTime, DueDateDateTime
     * LineItems: each invoice line with description, quantity, unit price, TVA rate
     * TaxTotal: TVA amount HT + TTC
     * PaymentMeans: IBAN from profile
   - If profile.statut = 'auto-entrepreneur': TVA rate = 0, include exemption note
   - Returns: XML string (UTF-8)

2. Extend InvoicePDFDocument.tsx → new function generateFacturXPDF():
   - Use existing pdf-lib (confirm installed, install if not)
   - Step 1: render the existing React-PDF invoice to a PDF buffer
   - Step 2: use pdf-lib to embed the XML as a file attachment named 'factur-x.xml'
     with AFRelationship = 'Alternative' (ZUGFeRD spec)
   - Step 3: set PDF XMP metadata: conformance level BASIC-WL or EN16931
   - Returns: Uint8Array PDF buffer

3. Download trigger in InvoicesPage.tsx:
   - Existing PDF download button stays unchanged for Starter/trial
   - For Pro users: replace with a split button (shadcn DropdownMenu):
     * "Télécharger PDF standard"
     * "Télécharger Factur-X (PDF + XML)" → calls generateFacturXPDF()
   - Filename: same generateDocumentName() convention + "-facturx.pdf"
   - Add small badge on the Pro button: "Conforme FR 2026"

4. Mention on PDF:
   - Add one line in invoice PDF footer (InvoicePDFDocument.tsx):
     Pro users: "Facture électronique conforme Factur-X / ZUGFeRD EN16931"
     Others: nothing

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- 4.3 cron uses service role key — server-side only
- 4.4 Factur-X gated behind plan = 'pro' (useSubscription, not usePlanLimits)
- XML must be valid UTF-8, well-formed — use string template, not a DOM parser
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points
- Confirm Phase 4 is fully closed
- Next task: Phase 4 audit then Phase 5 — 5.1 project timer
```

## PROMPT 20 — PHASE 5 / TASK 5.1 + 5.2 + 5.3 · Timer + Manual entry + Timesheet

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1–4 fully done. You are opening Phase 5 — Le Temps — with tasks 5.1, 5.2, and 5.3.
These three tasks share the same data model and are built together.

## BEFORE WRITING ANY CODE — READ FIRST:
1. supabase/migrations/ — latest migration number, projects table schema
2. src/stores/ — existing Zustand stores (useProjectWizardStore) to follow for timer state
3. src/components/layout/AppLayout.tsx — topbar where the active timer widget lives
4. src/pages/PlanningPage.tsx — task structure, how tasks link to projects
5. src/hooks/useProjects.ts — project list pattern to reuse in timer project selector
6. package.json — confirm zustand is installed

State your implementation plan in 4 bullet points, then proceed.

## SHARED DATA MODEL — create first

Migration — new table time_entries with RLS:
```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- computed on stop, stored for fast queries
  is_running BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: user sees only their own entries (4 standard policies)
-- Constraint: only one is_running=true per user at a time
--   ADD CONSTRAINT one_active_timer EXCLUDE USING btree (user_id WITH =) WHERE (is_running = true)
```

Types in src/types/time.ts:
- TimeEntry, TimeEntryInsert, TimeEntryUpdate
- TimerState: { isRunning, activeEntry, elapsedSeconds }

## 5.1 — Project timer (start / stop / pause)

1. Zustand store src/stores/timerStore.ts:
   - State: { isRunning, activeEntryId, projectId, taskId, description, startedAt, elapsedSeconds }
   - Actions: startTimer(projectId, taskId?, description?), stopTimer(), pauseTimer(), resumeTimer()
   - On startTimer: INSERT time_entry with is_running=true, started_at=now()
   - On stopTimer: UPDATE set ended_at=now(), duration_seconds=elapsed, is_running=false
   - On mount: check Supabase for any is_running=true entry for the user → restore state
     (handles page refresh — timer keeps running server-side)
   - Tick: setInterval every second to increment elapsedSeconds in state

2. ActiveTimerWidget in AppLayout.tsx topbar (always visible when timer is running):
   - Shows: elapsed time HH:MM:SS (live ticking) + project name + "⏹ Stop" button
   - Click on widget → opens TimerPanel slide-over
   - Position: right side of topbar, replaces or sits next to existing actions

3. TimerPanel slide-over (shadcn Sheet):
   - Project selector: searchable select from user's active projects
   - Task selector: optional, filtered by selected project
   - Description: optional text input
   - Start/Stop/Pause buttons with clear states
   - "Entrée manuelle" shortcut link → opens manual entry form (5.2)
   - Recent entries list: last 5 time_entries for today

4. Start timer shortcut on ProjectDashboardModal and task rows in PlanningPage:
   - Small "▶ Démarrer" button on each project header and task row
   - Clicking pre-fills project/task in the timer and starts it

## 5.2 — Manual time entry

For hours worked without the timer running.

1. ManualTimeEntryModal (new component src/components/time/ManualTimeEntryModal.tsx):
   - Fields:
     * Date (date picker, default today)
     * Project (searchable select, required)
     * Tâche (optional, filtered by project)
     * Heure de début + Heure de fin (time pickers) OR Durée HH:MM (toggle)
     * Description (optional textarea)
   - Validation (Zod):
     * ended_at must be after started_at
     * duration must be > 0 and < 24h
     * date cannot be in the future
   - On save: INSERT time_entry with is_running=false, duration_seconds computed

2. Access points:
   - "Ajouter une entrée" button in TimerPanel
   - "Ajouter une entrée" button in the timesheet page (5.3)
   - Keyboard shortcut hint: shown as tooltip, no actual shortcut binding needed

## 5.3 — Timesheet view

Weekly and monthly view of all time entries per project and client.

1. New page src/pages/TimesheetPage.tsx at route /temps:
   - Add "Temps" entry to AppLayout sidebar under "Outils" section

2. View toggle: Semaine · Mois (default: current week)

3. Weekly view:
   - Grid: rows = Mon–Sun, grouped by project
   - Each row: project color dot + project name + daily totals + week total
   - Cell: shows duration if entry exists, empty otherwise
   - Click on cell → opens ManualTimeEntryModal pre-filled with that day + project
   - Bottom row: daily totals across all projects
   - Navigation: prev/next week arrows + "Aujourd'hui" button

4. Monthly view:
   - List grouped by project: project name + total hours for the month
   - Sub-rows: each time_entry with date, description, duration
   - Collapsible per project (shadcn Collapsible)
   - Month total at bottom

5. Summary stats (top of page, updates with period):
   - Total heures: sum of all duration_seconds / 3600
   - Heures facturables: sum where project has a linked quote (approximate)
   - Répartition par projet: small horizontal stacked bar (Recharts) — each project a color

6. Data hook src/hooks/useTimeEntries.ts:
   - getEntriesForPeriod(startDate, endDate): TimeEntry[]
   - getWeeklySummary(weekStart): { byProject, byDay, total }
   - getMonthlySummary(year, month): { byProject, total }
   - Edit + delete mutations with TanStack Query invalidation
   - staleTime: 1 minute

7. Edit/delete on time entries:
   - Each entry row: edit icon (opens ManualTimeEntryModal pre-filled) + delete icon
   - Delete: confirm dialog "Supprimer cette entrée de temps ?" — no undo

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- RLS on time_entries — user sees only their own data
- Timer state persists across page refresh via Supabase (not just localStorage)
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points:
  1. Start timer on a project → navigate to another page → timer still ticking in topbar
  2. Stop timer → entry appears in timesheet for today
  3. Add manual entry for yesterday → appears in correct day in weekly grid
- Confirm next task: 5.4 convert time entries → quote/invoice
```

## PROMPT DEBUG-02 — Fix timer start + manual entry save (Phase 5.1 + 5.2)

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
TWO bugs to fix — both related to time_entries. Do not build anything new.

## BEFORE WRITING ANY CODE — READ FIRST (in this exact order):
1. supabase/migrations/ — find the time_entries migration, read the full SQL including
   the EXCLUDE constraint and RLS policies
2. src/stores/timerStore.ts — read startTimer() action completely, find the Supabase INSERT call
3. src/components/time/ManualTimeEntryModal.tsx — read the save handler and Zod schema
4. src/hooks/useTimeEntries.ts — read insert mutation, error handling
5. src/lib/supabase.ts — confirm client is initialized correctly
6. Browser console errors if mentioned — factor them into diagnosis

For each file: identify the exact line causing the failure before writing any fix.

## BUG 1 — "Démarrer" button does nothing

Likely causes in order of probability:
1. EXCLUDE constraint on time_entries failed silently during migration →
   table exists but INSERT throws a PostgreSQL error that is swallowed
   Fix: check if constraint was created — if not, replace with simpler unique partial index:
   CREATE UNIQUE INDEX one_running_timer_per_user
   ON time_entries (user_id) WHERE (is_running = true);

2. startTimer() Supabase INSERT missing required fields or wrong column names →
   silent failure if .throwOnError() not called
   Fix: add .throwOnError() to the INSERT chain, log the error explicitly

3. timerStore not initialised in the component tree →
   useTimerStore() returns undefined actions
   Fix: verify timerStore is imported and called correctly in TimerPanel and
   the "Démarrer" button component

4. RLS policy blocks INSERT →
   anon or wrong user context on the Supabase client used in timerStore
   Fix: ensure timerStore uses the authenticated supabase client (not anon)

5. Zustand action called but React state update not triggering re-render →
   missing shallow comparison or stale closure
   Fix: verify startTimer is destructured from useTimerStore with correct selector

## BUG 2 — Manual entry shows "Impossible..." on save

Likely causes in order of probability:
1. Zod validation failing silently — duration or time field mismatch →
   ended_at computed as before started_at due to date+time assembly bug
   Fix: log the exact Zod error, fix the date+time assembly:
   started_at = new Date(`${date}T${startTime}:00`) — verify this produces a valid Date

2. time_entries INSERT via useTimeEntries mutation fails with Supabase error →
   check if duration_seconds is being computed correctly before insert
   Fix: duration_seconds = Math.round((ended_at - started_at) / 1000) — must be > 0

3. "Impossible..." is a caught error string — find where it is thrown:
   grep for "Impossible" in src/ — read the exact catch block and the error it receives

4. project_id FK constraint failing — project_id passed as undefined or empty string
   Fix: ensure project_id is a valid UUID from the selector, not an empty string

5. RLS INSERT policy missing or wrong →
   policy allows SELECT but not INSERT for the user
   Fix: verify migration has: FOR INSERT WITH CHECK (user_id = auth.uid())

## FIX REQUIREMENTS
- Find the root cause of EACH bug before writing any fix
- State root cause in 1 sentence per bug
- Minimal fix only — do not refactor or restructure working code
- After fix: add .throwOnError() to ALL Supabase mutations in time_entries related code
  so errors surface immediately instead of failing silently
- Remove any temporary console.logs before finishing

## CONSTRAINTS
- TypeScript strict — zero any
- Do not change any UI, routing, or unrelated feature code
- tsc and vite build must pass clean after fix

## WHEN DONE
- State root cause of Bug 1 in 1 sentence
- State root cause of Bug 2 in 1 sentence
- List every file modified
- 3 manual test points:
  1. Click "Démarrer" on a project → timer starts, topbar widget appears with ticking clock
  2. Stop timer → entry saved, appears in timesheet for today
  3. Add manual entry → saves without error, appears in correct day in weekly grid
- Confirm next task: 5.3 timesheet view (if not yet done) or 5.4 convert time → invoice
```

## PROMPT DEBUG-03 — Timer still broken: migration never applied

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
The time_entries table does not exist in Supabase — the fixed migration was written but never applied.
Both bugs persist because of this single root cause.
Do not build anything. Verify, then provide the exact SQL to run manually.

## BEFORE WRITING ANY CODE — READ FIRST:
1. supabase/migrations/00029_time_entries.sql — read the full current SQL after the fix
2. src/stores/timerStore.ts — confirm .throwOnError() is present on startTimer INSERT
3. src/hooks/useTimeEntries.ts — confirm .throwOnError() is on all 3 mutations
4. Check if any other migration references time_entries (grep migrations/ for "time_entries")

## YOUR JOB

1. Verify the migration SQL is clean and will succeed:
   - Confirm EXCLUDE USING btree is gone — replaced with CREATE UNIQUE INDEX
   - Confirm all 4 RLS policies are present:
     SELECT: (user_id = auth.uid())
     INSERT: WITH CHECK (user_id = auth.uid())
     UPDATE: USING (user_id = auth.uid())
     DELETE: USING (user_id = auth.uid())
   - Confirm is_running constraint uses: CREATE UNIQUE INDEX one_running_timer_per_user
     ON time_entries (user_id) WHERE (is_running = true)
   - Confirm duration_seconds column is INTEGER (not BIGINT or INTERVAL)
   - If any of the above are wrong: fix them in the migration file first

2. Output the complete corrected migration SQL as a clean copyable block so it can be
   run directly in the Supabase SQL Editor — no partial statements, no comments that
   could break execution, wrapped in BEGIN; ... COMMIT;

3. After the migration is confirmed correct, verify these two things in the app code
   are still in place from DEBUG-02:
   - timerStore.ts startTimer: INSERT uses .throwOnError()
   - useTimeEntries.ts: all mutations use .throwOnError()
   - If either was reverted: restore it

4. Add one defensive check in timerStore.ts startTimer():
   Before the INSERT, query: SELECT COUNT(*) FROM time_entries LIMIT 1
   If this throws "relation does not exist" → show a toast:
   "Configuration en cours — veuillez patienter quelques secondes et réessayer."
   This prevents the silent failure UX if the migration is ever missing again.

## ACTION REQUIRED FROM YOU (the developer) after this prompt completes:
The prompt will output a SQL block. You must:
1. Go to Supabase Dashboard → SQL Editor
2. Paste and run the migration SQL
3. Verify the table appears in Table Editor under "time_entries"
4. Then test: click "Démarrer" → timer should start immediately

## CONSTRAINTS
- TypeScript strict — zero any
- Minimal code changes only — do not touch anything unrelated
- tsc and vite build must pass clean

## WHEN DONE
- Output the complete ready-to-run SQL block
- List any files modified
- Confirm: once migration is run manually, timer start and manual entry will work
- Next task: confirm 5.3 timesheet is working, then 5.4 convert time → invoice
```

## PROMPT 21 — PHASE 5 / TASK 5.4 + 5.5 · Convert time → invoice + Profitability chat · CLOSES PHASE 5

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Phases 1–4 fully done. Phase 5 tasks 5.1, 5.2, 5.3 done. You are implementing 5.4 and 5.5 —
the final two tasks of Phase 5 and the entire roadmap.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/pages/TimesheetPage.tsx + src/hooks/useTimeEntries.ts — time entry structure,
   how duration_seconds is stored, how entries link to projects
2. src/pages/QuoteBuilderPage.tsx — how quote lines are structured, route state pattern
   used by CostCalculatorPage to pre-fill (reuse same pattern)
3. src/pages/InvoicesPage.tsx + src/hooks/useInvoices.ts — invoice creation flow
4. src/types/quote.ts + src/types/ — QuoteLine or equivalent type to construct
5. src/lib/gemini.ts or supabase/functions/ — existing Gemini call pattern (server-side)
6. src/components/layout/ChatAssistant.tsx — existing chat panel to extend for 5.5

State your implementation plan in 4 bullet points, then proceed.

## 5.4 — Convert time entries → quote or invoice

From the timesheet, the freelancer selects tracked hours and converts them to
billable lines in a quote or invoice in one click.

1. Selection UI in TimesheetPage.tsx:
   - Add checkbox to each time entry row (both weekly and monthly views)
   - "Sélectionner tout" checkbox in the section header
   - When 1+ entries selected: sticky action bar appears at bottom of page:
     "X entrées sélectionnées · Xh Xmin · [Créer un devis] [Créer une facture]"
   - Action bar uses brand colors, fixed bottom, z-50

2. Conversion logic src/lib/time-to-billing.ts:
   - groupEntriesByProject(entries: TimeEntry[]): GroupedEntries[]
     Groups selected entries by project, sums duration_seconds per group
   - buildQuoteLines(groups: GroupedEntries[], products: Product[]): QuoteLine[]
     For each project group:
     * description: project name + " — " + comma-joined entry descriptions (truncated 80 chars)
     * quantity: total hours rounded to 2 decimals (duration_seconds / 3600)
     * unit: 'heure'
     * unit_price: try to find matching hourly product in catalogue by unit='heure',
       fallback to 0 (user fills in manually)
   - Returns array of QuoteLines ready to inject into QuoteBuilderPage

3. "Créer un devis" button:
   - Call buildQuoteLines() with selected entries + user's catalogue products
   - Navigate to /devis/nouveau with route state: { prefillLines: QuoteLine[], fromTimesheet: true }
   - QuoteBuilderPage reads this state and pre-fills the line items
   - Read existing CostCalculatorPage → QuoteBuilderPage state pattern and reuse exactly

4. "Créer une facture" button:
   - Same buildQuoteLines() call
   - Open CreateInvoiceModal (or navigate to invoice creation) with pre-filled lines
   - Read existing invoice creation flow first — follow same pattern
   - If invoice creation is done via modal: pass prefillLines as prop
   - If via page: use route state same as quote

5. Post-conversion:
   - After navigating away, clear the timesheet selection state
   - Do NOT mark entries as billed automatically — user controls this
   - Optional: add is_billed BOOLEAN DEFAULT false column to time_entries
     (migration) and set it to true when the user confirms the quote/invoice was created
     Show billed entries with a subtle ✓ badge in the timesheet

## 5.5 — Project profitability analysis (Gemini chat enrichment)

The existing Gemini chat assistant gains awareness of time tracking data so it can
answer "Est-ce que le projet Dupont est rentable ?"

1. Extend the chat context in the existing Gemini chat Edge Function
   (supabase/functions/chat-assistant/index.ts — read it fully first):

   Add a new context block "TIME_TRACKING" to the system prompt cache:
   - For the last 30 days: sum of duration_seconds per project from time_entries
   - For each project: total hours tracked, project name, linked client name
   - Format: "Projets — heures trackées (30 derniers jours) :\n- [project] ([client]): Xh"
   - Cap at 10 projects to keep context lean

2. Extend the context with invoice data per project:
   - For each project in the time context: sum of paid invoices amount
   - This allows Gemini to compute: revenue / hours = effective hourly rate
   - Format: "CA facturé par projet :\n- [project]: X€ (Y factures payées)"

3. New suggested prompt chips in ChatAssistant.tsx:
   - Add these quick-prompt buttons below the input (if chip UI already exists, add to it;
     if not, create a simple flex row of shadcn Badge/Button chips):
   - "📊 Projet le plus rentable ?"
   - "⏱ Combien d'heures ce mois ?"
   - "💶 Mon taux horaire effectif ?"
   - Clicking a chip fills the input with that text and submits immediately

4. Gemini system prompt addition (append to existing system prompt, do not replace):
   "Tu as accès aux données de time tracking de l'utilisateur.
   Pour analyser la rentabilité d'un projet : compare les heures trackées au CA facturé
   pour calculer le taux horaire effectif. Un projet est rentable si le taux horaire
   effectif est supérieur au taux journalier moyen du freelance divisé par 8.
   Réponds toujours en français, de façon concise et actionnable."

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- Gemini context enrichment server-side only — never expose data client-side beyond
  what is already shown in the UI
- is_billed migration: nullable, no NOT NULL constraint — existing entries unaffected
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points:
  1. Select 3 time entries in timesheet → "Créer un devis" → QuoteBuilderPage opens
     with pre-filled lines showing correct hours and project names
  2. Open Gemini chat → click "📊 Projet le plus rentable ?" → Gemini responds with
     a project name and its effective hourly rate
  3. Ask chat "Combien d'heures j'ai travaillé ce mois ?" → correct answer from time data
- Confirm Phase 5 is fully closed
- Confirm ALL 5 phases of the Prezta roadmap are complete
- Next step: full product audit across all phases
```

## PROMPT 22 — AUDIT FINAL · Vérification complète des 5 phases avant lancement

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
All 5 phases of the roadmap are declared complete. This is the final pre-launch audit.
Read only — do not build or fix anything. Report findings, then list fixes in priority order.

## YOUR JOB: AUDIT ALL 5 PHASES

For each item below, locate the relevant files, read their actual content, and verdict:
✅ SOLID — fully implemented, no gaps
⚠️ PARTIAL — exists but something is missing or broken
❌ MISSING — not implemented at all

---

## PHASE 1 — LE SOCLE

### Auth + Profile
- [ ] Login / Signup / ForgotPassword / Magic Link all work
- [ ] ProtectedRoute redirects unauthenticated users to /login
- [ ] AuthContext isLoading resolves within 3s — no infinite spinner
- [ ] Profile: SIRET Luhn validation, TVA FR, IBAN, statut juridique (5 types)
- [ ] CGI art.293B auto-injected for auto-entrepreneur

### Clients
- [ ] CRUD + search + inline creation
- [ ] SIRENE/INSEE autocomplete on client form
- [ ] Activity timeline per client (client_events table)
- [ ] CSV import with preview + column mapping

### Catalogue
- [ ] CRUD + starred favorites
- [ ] Gemini catalogue generation on first login (Pro only)

### Projects
- [ ] 3-step wizard: Name → Client → Documents
- [ ] Gemini document suggestions in wizard (Pro only)

### Documents
- [ ] Quote builder: catalogue picker, free lines, TVA live, Gemini brief
- [ ] PDF generation: React-PDF preview + pdf-lib export
- [ ] Auto-naming: YYYY-MM-CLIENT-Type-vN.pdf everywhere
- [ ] Invoice register: CRUD, status, search, filter

### Dashboard
- [ ] 4 KPI cards load correctly
- [ ] Recharts bar chart renders (no -1 width/height warning)
- [ ] Actions Requises feed: stale signatures, overdue tasks, overdue invoices
- [ ] Skeleton loaders on first load

### Infrastructure
- [ ] Gemini chat panel opens and responds
- [ ] Lemon Squeezy checkout works for Starter + Pro (monthly + annual)
- [ ] Trial countdown banner visible for trial users
- [ ] Plausible + Sentry initialised in main.tsx

---

## PHASE 2 — LA CONFIANCE

### Contracts
- [ ] 4 template types: prestation, NDA, CGV, mission freelance
- [ ] Block editor: add / remove / reorder clauses
- [ ] AI clause generator calls server-side Edge Function (not client-side)
- [ ] PDF export with correct legal mentions per status

### FIRMA
- [ ] Send for signature available on quotes AND contracts
- [ ] SendForSignatureModal shows signer name (contact_name, not company)
- [ ] Blocked with inline error if contact_name missing
- [ ] firma-webhook updates status automatically

### Status pipeline
- [ ] DocumentStatusBadge on quotes list, contracts list, project detail
- [ ] status_history JSONB populated on every status change
- [ ] Stale "Envoyé 7+ days" alert in Actions Requises

### Tracking + Emails
- [ ] Quote read-tracking pixel fires on share page
- [ ] Status flips sent → lu on first view, no regression
- [ ] Email template library: 7 templates, editor at /parametres/emails
- [ ] substituteVars() replaces all {{variables}} correctly

### Reminders + Planning
- [ ] ReminderPreviewModal: correct level by days overdue
- [ ] Gemini reminder call is server-side
- [ ] reminder_count + last_reminder_sent_at updated on send
- [ ] Task list in project detail: inline add, priority badges, overdue tint
- [ ] /planning weekly grid with prev/next navigation
- [ ] Overdue tasks in dashboard Actions Requises

---

## PHASE 3 — L'AUTONOMIE

### Tools
- [ ] /calculateur: 3 input sections, live summary, export to catalogue + create quote
- [ ] /revenus: period filter, 4 KPIs, vs prior period deltas, 2 Recharts charts
- [ ] /export-comptable: year/month filter, ZIP download with correct folder structure
- [ ] /temps: weekly + monthly timesheet, edit/delete entries

### Contracts + Portal
- [ ] Document expiry alerts: expires_at field, J-30 + J-7 cron emails
- [ ] NotificationBell in header with badge count + dropdown
- [ ] Client portal /portail/:token: no auth, 3 tabs, PDF download
- [ ] Portal token + expiry + enable toggle in project detail
- [ ] Anon RLS strictly scoped to token + enabled + not expired

### Legal + Plans
- [ ] generateLegalMentions() covers all 5 statuts juridiques
- [ ] Applied to QuotePDF + InvoicePDF + ContractPDF
- [ ] Profile completeness warning on QuoteBuilderPage + InvoicesPage
- [ ] plans.ts constants: trial(15docs/3proj) · starter(50/10) · pro(∞)
- [ ] user_active_document_counts View exists with security_invoker RLS
- [ ] Document limit block → brouillon non envoyable + PlanLimitModal
- [ ] Project limit block in wizard
- [ ] FIRMA gate in SendForSignatureModal
- [ ] AI gate on: clause generator, reminders, route optimization, catalogue generator
- [ ] Archive action on all document lists + collapsible archived section
- [ ] Pricing page: 3 cards, annual toggle, à la carte signatures section

### Route optimization
- [ ] "Optimiser ma journée" visible on planning for Pro users with 2+ addressable tasks
- [ ] Calls api/optimize-route Edge Function (GOOGLE_MAPS_API_KEY server-side)
- [ ] Gemini response parsed as JSON, degraded gracefully on error

---

## PHASE 4 — L'INTELLIGENCE

### Analytics
- [ ] "Analyse" tab in /revenus: acceptance rate, avg sign delay, avg pay delay
- [ ] Top 3 clients by CA displayed
- [ ] Late payer clients list with Relancer button
- [ ] Quiet months detected after 6+ months data
- [ ] Placeholder shown if < 3 months data

### Benchmark + Seasonality
- [ ] "Benchmark marché" button on catalogue products (Pro only)
- [ ] BenchmarkModal: verdict badge, range bar, advice, confidence
- [ ] Seasonality cron: runs 1st of month, sends email + in-app if slow month ahead
- [ ] Opt-out toggle in settings

### Factur-X
- [ ] generateFacturXXML() produces valid UTF-8 ZUGFeRD XML
- [ ] Split download button for Pro: PDF standard vs Factur-X
- [ ] Footer mention on Pro invoices: "Conforme Factur-X / ZUGFeRD EN16931"

---

## PHASE 5 — LE TEMPS

### Timer
- [ ] Start/stop timer from project detail and task rows
- [ ] Active timer widget in topbar: HH:MM:SS ticking + project name + Stop
- [ ] Timer persists across page refresh (restored from Supabase on mount)
- [ ] Only one active timer per user enforced (unique index)

### Timesheet
- [ ] Manual entry modal: date, project, time or duration, description
- [ ] Weekly grid: Mon–Sun, grouped by project, daily totals
- [ ] Monthly view: grouped by project, collapsible, month total
- [ ] Edit + delete on entries with confirm dialog
- [ ] is_billed badge on converted entries

### Conversion + Chat
- [ ] Checkbox selection in timesheet + sticky action bar
- [ ] "Créer un devis" pre-fills QuoteBuilderPage with correct hours + project
- [ ] "Créer une facture" pre-fills invoice creation with correct lines
- [ ] Gemini chat has TIME_TRACKING context (last 30 days per project)
- [ ] 3 profitability chips: rentable, heures mois, taux horaire

---

## CROSS-CUTTING CHECKS

### Security
- [ ] No VITE_-prefixed secret keys with write permissions
- [ ] All Gemini calls server-side (Edge Functions only)
- [ ] GOOGLE_MAPS_API_KEY never in client bundle
- [ ] Client portal uses anon key only — never service role
- [ ] All Supabase tables have RLS enabled with 4 policies

### Code quality
- [ ] tsc --noEmit → 0 errors
- [ ] vite build passes clean
- [ ] No any types remaining
- [ ] All UI text in French

### UX
- [ ] Login → /dashboard loads without "Chargement" freeze
- [ ] No Recharts -1 width/height warnings in console
- [ ] No missing DialogContent Description warnings (or aria-describedby set)
- [ ] Mobile responsive: pricing page, client portal, planning page

---

## REPORT FORMAT (required)

### ✅ SOLID ITEMS
List each item that passes fully — grouped by phase.

### ⚠️ PARTIAL ITEMS
For each: what exists · what is missing · fix size (small / medium / large).

### ❌ MISSING ITEMS
For each: what needs to be built from scratch · estimated effort.

### 🔧 TECHNICAL DEBT
TypeScript errors, RLS gaps, security issues, console warnings, dead code.

### 📍 PRE-LAUNCH FIX LIST
Priority-ordered list of everything ⚠️ and ❌.
Format: [PRIORITY 1–5] · [Phase] · [Item] · [What to do — 1 sentence]
Only mark Prezta as launch-ready when this section is empty.
```

---

## PROMPT 23 — PRE-LAUNCH FIX · P1 Blockers (4 items)

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
All 5 phases complete. Pre-launch audit identified 4 Priority-1 blockers.
Fix only these 4 items. Do not touch anything else.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/components/layout/ChatAssistant.tsx — find the hardcoded localhost:3001 fetch call
2. supabase/functions/chat-assistant/index.ts — understand the request/response shape
3. src/App.tsx — find all routes, check if /reset-password exists
4. src/pages/auth/ForgotPasswordPage.tsx — where does it redirect after sending the link?
5. server.js (root of project, untracked) — read the full LS webhook handler
6. src/pages/PricingPage.tsx — find the 5 checkout URLs, identify which are placeholder slugs

State your fix plan in 4 bullet points, then proceed.

## FIX 1 — ChatAssistant: replace localhost with Supabase Edge Function

In ChatAssistant.tsx, the fetch call to http://localhost:3001/api/chat-assistant
will 404 in production. Replace it:

1. Find the fetch() call — read how messages are sent and how the streaming response
   is read (ReadableStream vs ArrayBuffer)
2. Replace with supabase.functions.invoke('chat-assistant', { body: { messages, ... } })
   - Supabase invoke() returns { data: ArrayBuffer | object, error } — not a streaming
     ReadableStream. Read the existing edge function response shape first.
   - If the edge function returns a plain JSON object: adapt the response handler to
     read data directly instead of streaming
   - If streaming is required: use fetch() with the Supabase Edge Function URL:
     `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`
     with Authorization: Bearer [session.access_token] header
3. Keep identical UX — typing indicator, message append, error toast
4. Test: chat must work in both dev and production (no localhost references remain)

## FIX 2 — Password reset route

1. Read App.tsx routes — does /reset-password exist?
2. Read ForgotPasswordPage.tsx — what URL does the Supabase magic link point to?
   (Check supabase auth email template or the redirectTo param in resetPasswordForEmail())
3. If /reset-password route is missing:
   - Create src/pages/auth/ResetPasswordPage.tsx:
     * Reads #access_token from URL hash (Supabase puts it there)
     * Shows new password + confirm password fields (Zod: min 8 chars, must match)
     * On submit: supabase.auth.updateUser({ password: newPassword })
     * On success: toast "Mot de passe mis à jour" + navigate('/login')
     * On error: toast error message
   - Add route /reset-password in App.tsx (public, no ProtectedRoute)
4. If route already exists but is broken: fix the token reading logic

## FIX 3 — Commit and verify server.js

1. Read server.js completely — understand what it does
2. Verify it handles these Lemon Squeezy webhook events:
   - subscription_created → insert or upsert into subscriptions table with plan + status
   - subscription_updated → update plan + status
   - subscription_cancelled → set status = 'cancelled'
   - order_created (for à la carte signatures) → increment firma_signatures_used
     or add to a separate one-time purchases log
3. If any event handler is missing: add it following the existing pattern
4. Verify the webhook secret is validated (HMAC signature check on X-Signature header)
   If missing: add it — without this, anyone can fake a webhook and upgrade accounts
5. Add server.js to git tracking: output the command
   `git add server.js && git status`
   Note: Claude Code cannot run git — output the command for the developer to run

## FIX 4 — Lemon Squeezy checkout URLs

1. Read PricingPage.tsx — extract all 5 checkout URLs/variant IDs
2. Identify which are real UUIDs vs placeholder slugs
3. For each placeholder: add a clear TODO comment:
   `// TODO: replace with real LS variant ID from dashboard.lemonsqueezy.com`
   and log a warning in console.warn() in dev mode only:
   `if (import.meta.env.DEV) console.warn('LS variant ID not configured:', variantId)`
4. Do NOT hardcode fake UUIDs — keep placeholders visible so they are not missed
5. Output a checklist for the developer:
   □ Starter Monthly variant ID
   □ Starter Annual variant ID
   □ Pro Annual variant ID
   □ Extra signature pack variant ID
   (Pro Monthly is confirmed real — skip)

## CONSTRAINTS
- TypeScript strict — zero any
- No localhost references anywhere in src/ after this fix
- All UI text in French
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- Confirm: no localhost:3001 references remain in src/
- Confirm: /reset-password route exists and handles Supabase token
- Confirm: server.js webhook validates HMAC signature
- Output the git add command for developer to run
- Output the LS variant ID checklist
- Next task: Prompt 24 — P2/P3 fixes
```

---

## PROMPT 24 — PRE-LAUNCH FIX · P2 + P3 items

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Prompt 23 P1 blockers are fixed. Now fix the P2 and P3 items from the audit.

## BEFORE WRITING ANY CODE — READ FIRST:
1. Run: find src/ supabase/functions/ -name "*benchmark*" — report what exists
2. Run: ls supabase/functions/ — report all function names
3. src/pages/DashboardPage.tsx — find the "Assistant IA" button, read how it is wired
4. src/components/layout/AppLayout.tsx — how ChatAssistant open state is managed
5. supabase/migrations/00007_* or any migration referencing portal_link — read full SQL
6. src/pages/QuoteBuilderPage.tsx — find the "Générer depuis un brief" Gemini call

State your fix plan in 4 bullet points, then proceed.

## FIX 1 — BenchmarkModal + benchmark-rate (verify or create)

Run the find command above. Then:

IF FILES EXIST at an unexpected path:
- Move them to correct locations:
  src/components/catalogue/BenchmarkModal.tsx
  supabase/functions/benchmark-rate/index.ts
- Verify the modal is wired to the catalogue product rows in CataloguePage.tsx
- Verify canUseAI gate is applied (Pro only)

IF FILES ARE MISSING — create them:
BenchmarkModal.tsx:
- Props: { product: Product, userMetier: string, onClose: () => void }
- On open: calls supabase.functions.invoke('benchmark-rate', { body: { productName, unit, priceHT, userMetier } })
- Loading state during call
- Result display:
  * Verdict badge: sous_marche(danger) · dans_la_norme(success) · premium(brand)
  * Range bar: min–max with user price marked as a dot (use a simple div, not Recharts)
  * "Médiane marché: X€/[unit]"
  * Advice text in italic
  * Confidence: small muted text "Données : [confidence]"
  * "Mettre à jour mon tarif" → opens product edit modal

supabase/functions/benchmark-rate/index.ts:
- POST, JWT auth via Supabase
- Body: { productName, unit, priceHT, userMetier }
- Gemini (gemini-2.0-flash) prompt — return strictly:
  { verdict, marketMin, marketMax, marketMedian, advice, confidence }
- Parse JSON strictly, return 500 on parse failure

## FIX 2 — check-seasonality edge function (verify or create)

Run ls supabase/functions/. Then:

IF MISSING — create supabase/functions/check-seasonality/index.ts:
- Deno edge function, no cron decorator (Supabase cron is set via SQL pg_cron)
- Reads all users where seasonality_enabled = true
- For each user: fetch last 12 months of invoices (status='paid'), group by month
- If any upcoming month has avg CA < 60% of 12-month average:
  AND last_seasonality_alert_sent_at is null OR > 1 month ago:
  * Send Resend email (use RESEND_API_KEY env var):
    Subject: "Prezta · Votre mois de [month] est historiquement calme"
    Body: brief + CTA → /revenus#analyse
  * Update last_seasonality_alert_sent_at = now()
- Uses service role key — reads all users' data

Output the pg_cron SQL to schedule it (for developer to run in Supabase SQL Editor):
```sql
SELECT cron.schedule(
  'check-seasonality-monthly',
  '0 9 1 * *',
  $$SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/check-seasonality',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  )$$
);
```

## FIX 3 — Dashboard "Assistant IA" button disconnected

1. Read AppLayout.tsx — how is ChatAssistant open state currently managed?
2. Create src/stores/uiStore.ts (if it doesn't exist):
   ```ts
   import { create } from 'zustand'
   interface UIStore {
     isChatOpen: boolean
     openChat: () => void
     closeChat: () => void
   }
   export const useUIStore = create<UIStore>((set) => ({
     isChatOpen: false,
     openChat: () => set({ isChatOpen: true }),
     closeChat: () => set({ isChatOpen: false }),
   }))
   ```
3. Wire AppLayout.tsx to use useUIStore().isChatOpen
4. Wire the "Assistant IA" button in DashboardPage.tsx to call useUIStore().openChat()
5. Wire ChatAssistant open/close to the store

## FIX 4 — Move VITE_GEMINI_API_KEY call server-side

In QuoteBuilderPage.tsx, find "Générer depuis un brief" — it calls askGemini() from
src/lib/gemini.ts using the client-side VITE_GEMINI_API_KEY.

1. Create supabase/functions/generate-quote-brief/index.ts:
   - POST, JWT auth
   - Body: { brief: string, metier: string }
   - Gemini prompt: generate quote lines from brief description
   - Returns: { lines: Array<{ description, quantity, unit, unitPrice }> }
   - Mirror the generate-clause function exactly

2. In QuoteBuilderPage.tsx:
   - Replace askGemini() call with supabase.functions.invoke('generate-quote-brief')
   - Keep identical UX: loading state, error toast, lines inserted on success

3. Add TODO comment in src/lib/gemini.ts:
   `// All Gemini calls must go through Edge Functions. This file is deprecated.`
   Do NOT delete it yet — verify no other components import it first.

## FIX 5 — Verify portal anon RLS at DB layer

1. Read every migration file that mentions 'portal' or 'anon' — list them
2. Verify these RLS policies exist on the projects table:
   - anon SELECT: WHERE portal_enabled = true AND portal_expires_at > now()
3. Verify quotes, invoices, project_contracts have anon SELECT policies
   scoped to projects the user can access via portal
4. If any policy is missing: write the SQL and output it as a copyable block
   for the developer to run in Supabase SQL Editor
   (do not create a new migration file — output SQL only)

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- Confirm BenchmarkModal is wired to CataloguePage with canUseAI gate
- Confirm check-seasonality function exists
- Confirm Dashboard chat button opens ChatAssistant
- Confirm VITE_GEMINI_API_KEY no longer used in any src/ component
- Output pg_cron SQL for developer
- Output any portal RLS SQL for developer if needed
- Next task: Prompt 25 — P4/P5 cleanup
```

---

## PROMPT 25 — PRE-LAUNCH FIX · P4 + P5 cleanup · LAUNCH READY

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Prompts 23 and 24 done. Final cleanup — P4 and P5 items only. Small targeted fixes.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/hooks/useSireneSearch.ts line 41 — the any cast on SIRENE API results
2. src/pages/ClientPortalPage.tsx lines 19 + 146 — the any types
3. supabase/functions/chat-assistant/index.ts — msg: any in history map
4. src/components/contracts/ContractTemplateModal.tsx — the free-text category input
5. src/lib/validations/ or src/pages/ProfilePage.tsx — where SIRET is validated

State your fix plan in 3 bullet points, then proceed.

## FIX 1 — Type the SIRENE API response (useSireneSearch.ts)

Replace data.results.map((r: any) => with a proper interface:

```ts
interface SireneEtablissement {
  siret: string
  unite_legale: {
    denomination?: string
    nom?: string
    prenom_usuel?: string
    categorie_juridique_libelle?: string
  }
  adresse_etablissement: {
    numero_voie_etablissement?: string
    type_voie_etablissement?: string
    libelle_voie_etablissement?: string
    code_postal_etablissement?: string
    libelle_commune_etablissement?: string
  }
  etat_administratif_etablissement: string
}
```
Apply this type to the map callback. Remove the any cast entirely.

## FIX 2 — Type ClientPortalPage.tsx

Line 19: Replace QuoteLine[] | any[] with QuoteLine[] — read the QuoteLine type from
src/types/quote.ts and use it directly.
Line 146: Remove the as any cast on QuotePDFDocument — read what props it actually
expects and pass them correctly.

## FIX 3 — Type chat-assistant Edge Function history

In supabase/functions/chat-assistant/index.ts, replace msg: any in the history map
with an inline type:
```ts
interface ChatMessage { role: 'user' | 'assistant'; content: string }
```
Apply to the messages array type throughout the function.

## FIX 4 — Contract template category dropdown

In ContractTemplateModal.tsx, replace the free-text category input with a Select:
- Options limited to exactly 4 values:
  'Contrat de prestation de services'
  'NDA (Accord de confidentialité)'
  'CGV (Conditions Générales de Ventes)'
  'Contrat de mission freelance'
- Use shadcn Select component
- Default: 'Contrat de prestation de services'
- Existing templates with arbitrary categories: display as-is (read-only), but
  on edit they must choose from the 4 standard types

## FIX 5 — SIRET Luhn validation

In the profile Zod schema (find where SIRET is validated), add after length check:

```ts
.refine((siret) => {
  // Luhn algorithm for SIRET (14 digits)
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i])
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}, { message: 'Numéro SIRET invalide' })
```

Note: This is the standard Luhn check. Some valid SIRETs (e.g. La Poste: 35600000)
may fail — add a comment explaining this edge case.

## FINAL CHECK — tsc + build

After all 5 fixes:
1. Run tsc --noEmit — report any remaining errors and fix them
2. Run vite build — confirm clean build
3. grep -r "any" src/ --include="*.ts" --include="*.tsx" | grep -v "//.*any" |
   grep -v "node_modules" — list any remaining explicit any types

## CONSTRAINTS
- TypeScript strict — zero any remaining after this prompt
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- Minimal changes only — do not refactor working code

## WHEN DONE
- List every file modified
- Confirm tsc --noEmit → 0 errors
- Confirm vite build → clean
- Confirm zero explicit any types in src/
- State: Prezta is launch-ready ✅
```

---

# BETA ROADMAP — Fixes & Améliorations UX

## PHASE BETA-1 · Onboarding + Auth + Navigation globale

## PROMPT BETA-01 — Onboarding + Logout + Subscription management

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
All 5 phases done. You are now implementing beta UX fixes — Phase Beta-1.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/App.tsx — all routes, find logout handler and post-login redirect
2. src/contexts/AuthContext.tsx — signOut() method
3. src/pages/auth/SignupPage.tsx — post-signup flow, where user lands after confirm
4. src/components/layout/AppLayout.tsx — where subscription info is shown (or not)
5. src/hooks/useSubscription.ts — current plan detection
6. src/pages/PricingPage.tsx — existing pricing/subscription page

State your implementation plan in 4 bullet points, then proceed.

## FIX 1 — Logout → prezta.eu instead of /login

In AuthContext.tsx or wherever signOut() is called:
- After supabase.auth.signOut(): redirect to https://www.prezta.eu
  (use window.location.href = 'https://www.prezta.eu' — hard redirect, not React Router)
- In development (import.meta.env.DEV): redirect to / instead to avoid leaving localhost

## FIX 2 — Onboarding wizard after account creation

After email confirmation and first login (detect: profile has no siret AND no legal_status set):
1. Create src/pages/onboarding/OnboardingPage.tsx at route /onboarding
2. Redirect new users to /onboarding automatically in ProtectedRoute or AuthContext:
   - Check if profile is "empty" (no legal_status or null siret)
   - If yes AND current path is not /onboarding: redirect to /onboarding
3. Onboarding wizard — 4 steps with progress bar:
   Step 1 — Bienvenue: "Bienvenue sur Prezta ! Configurons votre espace en 3 minutes."
     - Nom complet + prénom (pre-filled from auth metadata if available)
     - Métier / activité (text input — used for Gemini catalogue generation)
     - "Commencer →"
   Step 2 — Informations légales:
     - Statut juridique (Select: Auto-entrepreneur, EURL, SASU, SAS, SARL)
     - SIRET (14 digits, Luhn validated)
     - Pays (France only for now)
     - "Suivant →"
   Step 3 — Coordonnées:
     - Adresse, ville, code postal
     - Téléphone
     - IBAN (optional)
     - "Suivant →"
   Step 4 — Choisir un plan:
     - Show 3 plan cards inline (Trial/Starter/Pro) — reuse PricingPage card components
     - "Commencer l'essai gratuit" → saves profile + redirects to /dashboard
     - "Choisir Starter" / "Choisir Pro" → saves profile + opens LS checkout
   - Each step saves to profiles table on "Suivant" (partial saves, not just on finish)
   - Skip button on Step 3 only ("Je compléterai plus tard")

## FIX 3 — Subscription management page for logged-in users

Create src/pages/SubscriptionPage.tsx at route /parametres/abonnement:
- Add "Abonnement" entry in AppLayout sidebar under "Compte" section
- Show current plan (from useSubscription):
  * Plan name badge + status (actif / essai / expiré)
  * Trial: "Essai gratuit — expire dans X jours"
  * Paid: "Prochain renouvellement le [date]"
- Upgrade/downgrade buttons:
  * On trial: show Starter + Pro cards with checkout buttons
  * On Starter: show Pro upgrade button + "Gérer mon abonnement" → LS customer portal
  * On Pro: show "Gérer mon abonnement" → LS customer portal URL
- Lemon Squeezy customer portal URL: read from existing LS integration
  (supabase.functions.invoke or direct LS API call for portal URL)
- Cancel subscription: "Annuler mon abonnement" → LS customer portal (handles cancellation)

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- Onboarding must not block users who already have a complete profile
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points:
  1. Create new account → email confirmed → lands on /onboarding → complete 4 steps → /dashboard
  2. Click logout → redirected to https://www.prezta.eu (or / in dev)
  3. Go to /parametres/abonnement → current plan shown with correct upgrade/manage options
- Next task: BETA-02 dashboard + navigation fixes
```

---

## PROMPT BETA-02 — Dashboard + Planning + Calendrier restructuration

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Beta phase. You are implementing UX restructuring of Dashboard, Planning, and Calendrier.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/pages/DashboardPage.tsx — current full layout, identify "Performance & Trésorerie" section
2. src/hooks/useDashboard.ts — which queries feed which sections
3. src/pages/PlanningPage.tsx — current weekly grid implementation
4. Find the Kanban component — grep for "kanban" or "Kanban" in src/
5. src/components/layout/AppLayout.tsx — sidebar navigation structure

State your implementation plan in 4 bullet points, then proceed.

## FIX 1 — Dashboard: remove Performance & Trésorerie

In DashboardPage.tsx:
- Remove the "Performance & Trésorerie" section entirely
- Remove the revenue chart (bar chart) — this data lives in /revenus
- Remove any KPI cards duplicating revenue data (CA mois, En attente paiement)
- KEEP: 4 KPI cards for operational data only:
  * Projets actifs
  * Documents à signer (en attente signature)
  * Tâches en retard
  * Factures en retard
- KEEP: "Actions Requises" feed — this is the core value of the dashboard
- KEEP: "Projets récents" list (next projects / upcoming deadlines)
- Result: dashboard = operational overview only, not financial

In useDashboard.ts:
- Remove revenue/CA queries that are no longer needed on dashboard
- Keep all operational queries (projects, tasks, signatures, invoices overdue)

## FIX 2 — Planning: replace weekly grid with Kanban des tâches

The current /planning page has a weekly grid. Replace it entirely with a Kanban board:
- Find the existing Kanban component (grep result from read step)
- 4 columns: "À faire" · "En cours" · "En révision" · "Terminé"
- Cards show: task title, project name chip (colored), priority dot, due date
- Filter bar at top: filter by project (Select) + filter by priority
- "Nouvelle tâche" button → opens existing ManualTimeEntryModal or task creation modal
- Drag to move between columns: use @hello-pangea/dnd or existing DnD if installed
  If no DnD library installed: use simple click-to-move (button per card to change status)
  Do NOT install a new DnD library without checking package.json first
- Keep the route /planning

## FIX 3 — Calendrier: remove Kanban, show schedule view

Find the Calendrier page (grep for "Calendrier" or "calendrier" or "CalendrierPage"):
- Remove the Kanban component from this page
- Replace with a proper calendar/schedule view:
  * Month view: grid calendar showing tasks and project deadlines as colored dots/chips
  * Week view: same as current planning weekly grid (move it here from /planning)
  * Toggle: "Mois" / "Semaine" buttons
  * Color per project (use a consistent color mapping)
  * Click on a day → shows tasks/events for that day in a side panel

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- Do not remove any data hooks that are used elsewhere
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points:
  1. Dashboard shows no revenue data, only operational KPIs + Actions Requises
  2. /planning shows Kanban with 4 columns, tasks can be moved between columns
  3. /calendrier shows month/week calendar with tasks as colored chips
- Next task: BETA-03 project + clients + catalogue fixes
```

---

## PROMPT BETA-03 — Projets + Clients + Catalogue fixes

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Beta phase. You are implementing fixes for Projects, Clients, and Catalogue.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/pages/ProjectWizard.tsx or project creation flow — find where client is selected
2. src/hooks/useClients.ts — client list query
3. src/pages/ClientsPage.tsx — current client list, any existing category/tag system
4. src/pages/CataloguePage.tsx — product list, creation modal
5. supabase/migrations/ — latest migration number
6. src/components/ui/ — existing Select, Combobox, or searchable dropdown components

State your implementation plan in 4 bullet points, then proceed.

## FIX 1 — Project wizard: searchable client selector

In the project wizard step "Client":
- Replace the current client list/select with a searchable Combobox (shadcn Combobox)
- Type to filter clients by name or company
- Show: client name + city in the dropdown option
- "Nouveau client" option at bottom of list → opens ClientModal inline
- If client list > 5 items: show search input by default (do not wait for user to type)

## FIX 2 — Client categories

1. Migration — add category column to clients table:
   ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS category TEXT;

2. Predefined categories (hardcoded list, user can also type custom):
   'Entreprise' · 'Particulier' · 'Association' · 'Collectivité' · 'Startup' · 'Agence'

3. In ClientModal.tsx — add "Catégorie" field:
   - shadcn Combobox: shows predefined list + allows free text entry
   - Optional field

4. In ClientsPage.tsx — add category filter:
   - Filter chips above the client list (one per category that has clients)
   - Click chip → filters list to that category
   - "Toutes" chip always first
   - Show category badge on each client row/card

## FIX 3 — Catalogue: product categories

1. Migration — add category column to products table:
   ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;

2. Predefined categories (user can also type custom):
   'Développement' · 'Design' · 'Conseil' · 'Formation' · 'Maintenance' · 'Autre'
   (or appropriate defaults — read existing products to see what categories make sense)

3. In product creation modal — add "Catégorie" field (same Combobox pattern as clients)

4. In CataloguePage.tsx — add category filter tabs or chips above product list

## FIX 4 — Catalogue: fix UI bugs

1. "Unité de facturation" dropdown transparent background:
   Find the Select component for unite in the product creation modal
   Add explicit background: bg-white or use shadcn SelectContent with proper styling
   The fix is likely: add `className="bg-white"` to SelectContent

2. AI catalogue generation — white buttons on white background:
   Find AiCatalogGenerator.tsx — identify buttons with no visible text
   Add explicit text color: text-gray-900 or text-primary to affected buttons

3. AI catalogue generation — fix the actual generation:
   Find the generate catalogue Edge Function call
   Read supabase/functions/chat-assistant or any catalogue generation function
   Test: does it call the correct endpoint? Does it parse the response correctly?
   Fix any broken API call — the generation must produce real catalogue items

## FIX 5 — Catalogue: CSV import

Add CSV import to CataloguePage.tsx (same pattern as ImportClientsModal):
1. "Importer CSV" button → ImportCatalogueModal
2. Expected columns: nom, description, prix_ht, unite, categorie
3. Separator auto-detection (; or ,)
4. Preview table before import
5. Batch INSERT into products table with RLS
6. Template download with correct headers + example row

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- RLS on new columns — inherited from parent table policies
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points:
  1. Create new project → client selector is searchable → type "Mar" → filters instantly
  2. Add category "Startup" to a client → filter chip appears → click filters correctly
  3. Catalogue CSV import → upload test file → preview shows → import creates products
- Next task: BETA-04 Modèles + Temps + Profile fixes
```

---

## PROMPT BETA-04 — Modèles contrats + Temps + Profil + Email confirmation

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Beta phase. You are implementing fixes for Modèles, Temps page, Profile, and auth emails.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/pages/ContractTemplatesPage.tsx or wherever contract templates are listed
2. src/components/contracts/ContractTemplateModal.tsx — template creation flow
3. src/components/contracts/ContractBlockEditor.tsx — block editor
4. src/pages/TimesheetPage.tsx — current timesheet layout
5. src/pages/ProfilePage.tsx — country field, legal status options, example text
6. supabase auth email templates location — check Supabase docs pattern for custom emails

State your implementation plan in 4 bullet points, then proceed.

## FIX 1 — Modèles: protect system templates + remove pencil icon

In the contract templates list:
1. Add is_system BOOLEAN DEFAULT false to contract_templates if not present
   System templates (from migration 00017 seeds) should have is_system = true
   Update the seeded templates: UPDATE contract_templates SET is_system = true WHERE user_id IS NULL
2. Remove the pencil/edit icon on system templates
   Show instead: "Utiliser comme base" button → creates a copy with user_id set
3. Users can only edit/delete templates where is_system = false AND user_id = auth.uid()
4. System templates: show a lock icon 🔒 and "Modèle officiel Prezta" badge

## FIX 2 — Modèles: simplified step-by-step creation wizard

When creating a new template, show two options:
Option A — "Mode expert" (existing block editor, unchanged)
Option B — "Guide pas à pas" (new wizard):

Create ContractWizardModal.tsx:
- Step 1: Choisir le type (4 types dropdown) + Nom du modèle
- Step 2: Parties (auto-filled from profile, confirm or edit)
- Step 3: Objet du contrat (text area: "Décrivez en quelques mots l'objet de cette mission")
- Step 4: Clauses essentielles — one by one, each with:
  * Clause name (ex: "Délai de paiement")
  * Simple text area
  * "Aide IA ✦" button → generates clause from description (calls generate-clause Edge Fn)
  * Preview panel on right showing the full contract being built in real time
- Step 5: Preview final + "Créer le modèle"
- Each step: "Précédent" / "Suivant" navigation

## FIX 3 — Temps page: rename + per-project view + calendar view

1. Rename the page:
   - Page title: "Suivi du temps" (instead of "Temps")
   - Sidebar label: "Suivi temps"
   - Route stays /temps

2. Add per-project grouping toggle:
   - Toggle: "Par date" (current) / "Par projet"
   - "Par projet" view: accordion per project, each showing its time entries
   - Show total hours per project + billable hours (is_billed = true)

3. Add calendar view tab:
   - Tab "Calendrier" alongside "Semaine" and "Mois"
   - Month calendar grid: each day shows total hours tracked as a colored indicator
   - Color intensity: 0h = white, 1-4h = light blue, 4-8h = blue, 8h+ = dark blue
   - Click on day → shows entries for that day in a side panel
   - Uses existing time_entries data — no new queries needed

## FIX 4 — Calculateur: move inside Catalogue

1. Remove /calculateur from sidebar as standalone entry
2. In CataloguePage.tsx: add tabs at the top:
   - Tab "Prestations" (current catalogue list)
   - Tab "Calculateur" (move CostCalculatorPage content here as a tab component)
3. Update App.tsx: /calculateur route still works but redirects to /catalogue?tab=calculateur
4. Sidebar entry: remove "Calculateur" separate link — it's now inside Catalogue

## FIX 5 — Profile: France only + French examples + fix country

In ProfilePage.tsx:
1. Country field: show only "France" for now
   - Replace free-text or multi-country select with a single display "France 🇫🇷"
   - Add comment in code: // TODO: add BE/CH when ready
2. Legal status: verify all 5 options are French statuses:
   Auto-entrepreneur · EURL · SASU · SAS · SARL
   Remove any Belgian statuses (SRL_BE, SA_BE, INDEPENDANT_BE) from the dropdown
3. Replace any English placeholder examples with French ones:
   - SIRET example: "123 456 789 00012"
   - IBAN example: "FR76 3000 6000 0112 3456 7890 189"
   - Phone example: "06 12 34 56 78"
   - Address example: "12 rue de la Paix, 75001 Paris"

## FIX 6 — Auth email: Prezta branding instead of Supabase default

Supabase sends confirmation emails with their default branding.
Fix this via Supabase Dashboard (output instructions for developer, no code change):

Output these exact instructions:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. For "Confirm signup" template:
   Subject: "Confirmez votre compte Prezta"
   Body: French branded email with Prezta logo reference and welcome message
3. For "Reset password" template:
   Subject: "Réinitialisez votre mot de passe Prezta"
4. For "Magic link" template:
   Subject: "Votre lien de connexion Prezta"

Also create src/emails/ConfirmSignupEmail.tsx using React Email if Resend is preferred
over Supabase default emails — wire to Supabase Auth webhook on signup event.

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- System templates protected at DB level (is_system check in RLS or service function)
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points:
  1. Contract templates list: system templates show lock icon, no pencil, "Utiliser comme base" works
  2. New template → "Guide pas à pas" → complete 5 steps → template created with all clauses
  3. Temps page: "Par projet" toggle shows accordion grouped by project with correct totals
- Next task: BETA-05 Notifications + Project deep links
```

---

## PROMPT BETA-05 — Notifications deep links + Project badges · CLOSES BETA PHASE

```
You are the sole engineer on Prezta (React 18 + TS strict + Vite + Tailwind v4 + shadcn/ui + Supabase).
Beta phase final prompt. Fixing notification deep links and project activity badges.

## BEFORE WRITING ANY CODE — READ FIRST:
1. src/components/layout/NotificationBell.tsx — notification item rendering, click handlers
2. src/pages/DashboardPage.tsx — "Actions Requises" feed, click handlers on items
3. src/hooks/useDashboard.ts — notification/action data shape, project_id availability
4. src/components/projects/ProjectDashboardModal.tsx — how it opens (props, state)
5. src/pages/PlanningPage.tsx or wherever tasks appear — task click handlers
6. src/App.tsx — project routes, how to navigate to a specific project

State your implementation plan in 3 bullet points, then proceed.

## FIX 1 — Notification deep links to specific project

When clicking a notification or action item that references a project:
- Should open directly to that project's detail view, not just /projets list
- Current behavior: navigates to /projets (just the list)
- Fix: navigate to /projets?project=[project_id] OR open ProjectDashboardModal directly

Implementation:
1. Add URL param support: /projets?open=[project_id]
2. In ProjectsPage.tsx: on mount, read open param from URL
   If present: find the project in the list and open ProjectDashboardModal automatically
3. Update all notification click handlers in:
   - NotificationBell.tsx: navigate(`/projets?open=${project_id}`)
   - DashboardPage.tsx "Actions Requises" items: same navigate pattern
   - Any other place notifications link to projects

## FIX 2 — Project notification badge

When a project has pending actions (overdue task, stale signature, unread update):
- Show a colored dot badge on the project card in the projects list
- Badge colors:
  * Red dot: overdue task or overdue invoice linked to project
  * Amber dot: document sent for signature 7+ days with no response
  * Blue dot: quote viewed by client (status = 'lu')
- Badge is a small absolute-positioned dot on the project card (top-right corner)
- Tooltip on hover: "X action(s) requise(s)"

Implementation:
1. In useDashboard.ts or new useProjectAlerts.ts hook:
   - Query: for each active project, count alert conditions above
   - Returns: Map<project_id, { count, highestSeverity }>
2. In the project card component (find it — ProjectCard.tsx or inline in ProjectsPage):
   - Add relative positioning to card
   - Add badge dot with correct color if alerts > 0
3. Keep it lightweight — single query joining projects with their alerts, not N+1

## CONSTRAINTS
- TypeScript strict — zero any
- Tailwind v4 only, shadcn/ui components
- All UI text in French
- URL param approach must not break existing /projets navigation
- tsc and vite build must pass clean

## WHEN DONE
- List every file created or modified
- 3 manual test points:
  1. Click notification "Tâche en retard — Projet Dupont" → /projets opens with Dupont modal already open
  2. Project with overdue task shows red dot badge on its card
  3. Project with stale signature shows amber dot badge
- Confirm beta phase fixes are complete
- Recommend: run full audit (Prompt 22 format) before public launch
```
