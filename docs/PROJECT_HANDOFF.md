# StudioDesk — Complete Project Handoff

Last updated: 2026-11-19 (Asia/Karachi)

Purpose: This is the continuity document for the next ChatGPT conversation. Read it before changing code, database schema, or deployment settings. It records the product, technical architecture, infrastructure, development history, migrations, completed work, known risks, and next steps.

Repository: https://github.com/Moizzshahid/studioDesk
Production: https://studiodesk-azonix.vercel.app
Owner / studio: Moiz / Azonix

---

## 0. Instructions for the next assistant

Continue the existing StudioDesk project. Do not restart it, scaffold a replacement, or create dummy/demo pages. First inspect the live repository and connected infrastructure, then compare them with this document.

Working rules:
1. Inspect before editing. Check current main SHA, open PRs, CI, Vercel production deployment, Supabase migration history, and relevant source files.
2. Keep changes real. A button must perform a real operation; no decorative controls or fake integrations.
3. Protect production data. Never reset Supabase, replay initial schema on a populated DB, seed fake records into the user's real workspace, or delete real records for testing.
4. Schema/RLS changes require a new ordered SQL migration. Never silently rewrite a migration already applied to production.
5. Every query, mutation, and Storage operation must respect the authenticated user's workspace.
6. Use a focused feature/fix branch, run typecheck/build, inspect preview, verify migration implications, open a PR, and merge only after checks pass.
7. HTTP 200 and CI success do not prove authenticated browser CRUD.
8. Never expose service-role credentials, tokens, .env.local, browser sessions, or real client files. Browser app uses public Supabase publishable/anon key only.
9. User prefers short, direct Roman Urdu explanations, while code and technical documentation should be professional English.
10. User explicitly chose to defer Supabase leaked-password protection because it may require a paid plan. Do not pressure them to upgrade or change billing.
11. User wants to perform the final manual browser tests themselves. Provide checklist and troubleshoot their results; do not claim tests are complete.
12. User wants an advanced, useful product and a minimal, premium, professional UI—not a generic beginner dashboard.

---

## 1. Product overview and origin

StudioDesk is a full-stack workspace / SaaS product for independent creative studios, freelancers, and small creative teams. It is being developed under Azonix.

The original product goal was a substantial, genuinely useful application rather than a static UI demo. Creative work context gets scattered across chats, documents, and people's memory: client preferences, brand rules, creative decisions, feedback, meeting notes, and lessons are lost between projects and handoffs.

Product promise:
**Plan the work. Care for the relationships. Keep the thinking behind every decision.**

Differentiator: **Studio Memory**, a human-curated, searchable context layer attached to clients and projects.

Product principles:
- Clarity over clutter.
- Context is an asset.
- Client relationships are more than CRM rows.
- Useful defaults, no fake functionality.
- Privacy boundaries are foundational.
- Human-authored memory first; AI should never silently invent or save facts.

### Design direction

The user rejected generic beginner-looking dashboards and wanted a premium, mature, carefully designed product.
- Initial login screen used an older purple/dark split-screen design; user disliked it and specifically asked to remove purple.
- A Failed to fetch login error appeared during sign-in.
- Login was redesigned with a cleaner, minimal, premium StudioDesk identity.
- User explicitly approved the new login screen and said it looked excellent.
- Login fetch issue was fixed; user later reported it no longer occurred.
- The rest of the application was still considered average by the user and remains a UI review/improvement area.
- Icons should be consistent with the design system, not mixed or visually unrelated.
- Do not reintroduce the old purple-heavy login theme.

---

## 2. Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| UI | React 19 |
| Language | TypeScript, strict mode |
| Backend | Supabase |
| Authentication | Supabase Auth, email/password |
| Database | Supabase PostgreSQL |
| Authorization | PostgreSQL Row Level Security |
| File storage | Supabase Storage, private bucket |
| Icons | lucide-react |
| Hosting | Vercel |
| Source control | GitHub |
| CI | GitHub Actions |

Runtime / package setup:
- Node engine is restricted to 22.x.
- Package manager: npm.
- package.json has an override for @supabase/storage-js at 2.119.0, added during earlier dependency resolution trouble.
- Scripts: dev, build, start, typecheck.
- A package lockfile was absent during the November 18 readiness review. November 19 work generates package-lock.json (lockfile v3) and changes CI from npm install to npm ci. Verify whether that branch has merged before assuming main contains the lockfile.

---

## 3. Infrastructure and canonical identifiers

### GitHub
- Repository: Moizzshahid/studioDesk
- Default branch: main
- URL: https://github.com/Moizzshahid/studioDesk
- PR #12: project detail and project record editing (merged).
- PR #14: production-readiness / Storage cleanup and security hardening (merged).
- PR #15: SVG document support alignment (merged).
- Active lockfile work: branch fix/npm-lockfile. At the time this file was created, PR had not yet been created; check current state.

### Supabase
- Project name: StudioDesk
- Project ID: twqorowpolbnomyvtqkx
- This DB is populated and must be treated as production data.
- Never reset it or replay the initial schema.
- Repository currently has 11 migration files. Production migration history was inspected after the November 19 changes; query it again before any new migration.

### Vercel
- Project name: studiodesk
- Project ID: prj_vYpIxpCls26bvdwk0kup7POartEq
- Team ID: team_iRdMXceHgmr7EkdGgvgoKhCp
- Production domain: https://studiodesk-azonix.vercel.app
- Production deployments were checked READY after PR #14 and PR #15 merges.
- Production /login and /projects returned HTTP 200 after those releases.
- HTTP 200 is only a route smoke test; it does not prove authenticated sign-in, CRUD, or file operations.

---

## 4. Application features represented in the codebase

The README and route-level code describe the following. Distinguish code presence from authenticated browser verification.

### Authentication and workspace
- Supabase email/password sign-up and sign-in.
- Signup trigger provisions a starter workspace and owner membership.
- Authenticated application shell and sign-out flow.
- Login screen redesigned and approved by user.
- Earlier Failed to fetch issue was fixed.

### Dashboard / Overview
- Recent projects and tasks.
- Client and memory summaries.
- Activity feed.
- Exact workspace-wide active project and open task totals corrected to use exact database counts rather than only limited preview rows.
- Counts must remain workspace-scoped.

### Projects
- Create, list, search, filter, and status tracking.
- Edit project name and description.
- Change linked client and set/edit due date.
- Project detail view.
- Project records (notes, briefs, decisions, meetings, links, deliverables, updates).
- Edit existing project records; create and delete records.
- Project deletion with retryable document cleanup support.
- Project deletion was specifically requested by user and implemented.
- Browser verification still required.

### Tasks
- Create, edit, search, filter.
- Associate task with project.
- Priority: low, medium, high, urgent.
- Status: todo, in_progress, done.
- Due dates.
- Complete, reopen, delete.

### Clients
- Directory; create, search, edit, delete.
- Contact details and internal notes.
- Workspace-scoped.

### Studio Memory
- Human-authored memory records.
- Categories: client_preference, brand_guideline, decision, feedback, lesson, meeting_note, other.
- Title and content.
- Optional project/client association.
- Create, edit, search, category filter, delete.
- Search currently browser-side over loaded records; PostgreSQL full-text index is a foundation, not a robust server-side global search engine.
- No autonomous AI memory engine has shipped. Future AI suggestions must be permission-aware and require human review.

### Project records
Record types include brief, note, decision, meeting, link, deliverable, update.

### Documents / attachments
- Private Supabase Storage bucket: studiodesk-files.
- Metadata table: public.project_attachments.
- File upload/download/delete flows exist in application code.
- 20 MiB size limit.
- MIME allowlist includes PDF, Word, Excel, PowerPoint, text, CSV, JPEG, PNG, WebP, SVG, ZIP.
- Upload path is workspace/project scoped.
- Project deletion cleanup queue stores exact Storage paths for retry.
- Do not assume real browser upload/download/delete has been tested.

### Activity
- Workspace-scoped activity timeline.
- Authenticated activity inserts permitted by RLS with actor constrained to current user or null.

---

## 5. Database architecture and tenant model

Tenant boundary:
- public.workspaces is the tenant boundary.
- public.workspace_members maps Supabase Auth users to workspaces and roles.
- Initial roles: owner, admin, member.
- New auth user trigger creates one starter workspace and one owner membership.
- Data tables carry workspace_id.
- RLS uses private.is_workspace_member(uuid).
- Same-workspace foreign keys prevent cross-tenant project/client references.

Core tables:
- workspaces
- workspace_members
- clients
- projects
- tasks
- memories
- activity_events
- project_records
- project_attachments
- storage_cleanup_jobs

Important relational rules:
- projects may reference a client only in the same workspace.
- tasks may reference a project only in the same workspace.
- memories may reference project/client only in the same workspace.
- project_records must reference a project in the same workspace; project delete cascades records.
- project_attachments must reference a project in the same workspace; project delete cascades metadata.
- storage_cleanup_jobs stores exact paths for cleanup, scoped to workspace, creator, timestamp.
- Storage bucket is private.

Security helper:
Public SECURITY DEFINER helpers were moved to private schema by migration 0002b. Trigger uses private.create_workspace_for_new_user(); RLS uses private.is_workspace_member(). Do not move these back to public casually.

---

## 6. Migration history — exact repository order

There are currently **11 SQL migration files**. Apply them in lexical filename order on a new, empty Supabase project only. Production already has migration history; never replay these as a batch on the existing production database.

1. 0001_initial_schema.sql
   - Enables pgcrypto.
   - Creates workspaces and membership.
   - Creates initial membership and signup workspace helpers.
   - Creates clients, projects, tasks, memories, activity_events.
   - Adds same-workspace foreign keys and indexes.
   - Enables RLS and creates initial policies.
2. 0002_security_and_indexes.sql
   - Revokes public helper privileges and grants authenticated membership helper execute.
   - Adds workspace/user and foreign-key query indexes.
3. 0002b_move_security_helpers_to_private_schema.sql
   - Creates private schema.
   - Moves membership and signup trigger helpers to private schema.
   - Recreates workspace/member/client/project/task/memory/activity RLS policies.
   - Drops old public helper functions.
4. 0003_project_records.sql
   - Creates project notes/briefs/decisions/meetings/links/deliverables/updates.
   - Enables RLS and authenticated CRUD under workspace membership.
5. 0004_activity_event_writes.sql
   - Adds authenticated insert policy for activity events with actor identity validation.
   - Adds activity index.
6. 0005_project_attachments.sql
   - Creates private studiodesk-files bucket (20 MiB limit and MIME allowlist).
   - Creates attachment metadata table and RLS.
   - Adds initial Storage object read/upload/delete policies.
7. 0006_production_readiness_hardening.sql
   - Adds private set_updated_at helper and updated_at triggers.
   - Adds foreign-key indexes.
   - Corrects activity index naming.
   - Rebuilds Storage read/upload/delete policies to tie files to existing project.
   - Removes SVG from MIME allowlist at this point; migration 0010 restores it.
8. 0007_reliable_storage_cleanup.sql
   - Creates storage_cleanup_jobs queue.
   - Adds RLS with workspace membership, current creator, path-format validation.
   - Corrects Storage read/upload path references to explicitly use storage.objects.name.
   - Allows deletion after project row has been cascaded away, so cleanup can retry.
9. 0008_storage_cleanup_creator_index.sql
   - Adds index for cleanup job creator foreign key.
10. 0009_scope_storage_delete_to_cleanup_queue.sql
    - Tightens Storage delete policy so deletion is allowed only for exact paths registered in workspace cleanup queue.
11. 0010_restore_svg_document_support.sql
    - Restores image/svg+xml to private bucket allowlist to match upload UI.

Migration nuance:
- Production hardening migration 0006 was reconstructed in the repository to represent the migration already applied to production as version 20261118155158.
- Do not rerun migrations against production. Query actual history first.
- The production migrations applied during November 18–19 hardening included reliable_storage_cleanup, storage_cleanup_creator_index, scope_storage_delete_to_cleanup_queue, and restore_svg_document_support. Re-query actual migration versions before any new change.

---

## 7. Security and reliability work completed

### November 18–19 production hardening (PR #14)

Issues found:
- Repository migration files needed reconciliation with production migration history.
- Storage RLS path checks were incorrect.
- Project deletion could leave private Storage objects behind if Storage removal failed.

Changes:
- Restored separate private helper migration in repository.
- Reconciled repository migration sequence with existing production history.
- Added retryable storage cleanup job table.
- Corrected Storage RLS path expressions to explicitly qualify storage.objects.name. An unqualified reference could resolve to an inner table column such as projects.name, which was incorrect.
- Read/upload authorization stays tied to a workspace member and existing project folder.
- Delete authorization now requires exact object paths listed in a cleanup queue.
- Delete can succeed after project metadata cascades away because cleanup authorization uses workspace membership plus queued path, not a project row.
- Corrected dashboard counts to use exact DB counts.
- Updated README/deployment docs.

PR #14: https://github.com/Moizzshahid/studioDesk/pull/14

### SVG MIME alignment (PR #15)
- Production bucket allowlist had removed image/svg+xml while upload UI explicitly accepted SVG.
- Added migration 0010_restore_svg_document_support.sql.
- Applied migration to linked Supabase project.
- Verified bucket remained private and SVG was allowed.
- PR #15 merged: https://github.com/Moizzshahid/studioDesk/pull/15

### SQL / RLS verification already performed

Temporary test transactions were used and rolled back; existing production data was not deliberately changed:
- Member could see own workspace's existing files (two files observed in that test).
- Another workspace saw zero of those files.
- Cross-workspace project reads returned zero.
- Cross-workspace project insert was rejected by RLS.
- Workspace-scoped project/task/record/attachment/cleanup-job insert and task update passed in test transaction.
- Project cascade delete removed dependent DB records/attachment metadata in test transaction.
- Cleanup job remained after project cascade in test transaction.
- SQL syntax checked in transactions before applying migrations.
- Storage object rows were not directly deleted using SQL.

These are DB-level checks, not real browser upload/download/delete/retry tests or two real-account E2E tests.

### Deferred leaked-password protection

Supabase Security Advisor previously showed leaked-password protection disabled. User chose to defer it because enabling it may require a paid plan. Do not change billing or pressure user to pay. Keep it as a known security limitation and do not claim fully client-ready until resolved or consciously accepted.

---

## 8. November 17–18 development timeline

### Initial build and repo setup
- User wanted a complete full-stack SaaS-style creative operations workspace with real backend and useful functionality.
- Product name StudioDesk, studio Azonix.
- Stack selected: Next.js, React, TypeScript, Supabase, Vercel.
- Differentiator defined as Studio Memory.
- User explicitly rejected placeholder-only or dummy interfaces.
- Repository Moizzshahid/studioDesk.
- A first codebase ZIP was created during early workflow.
- Initial implementation established auth, workspace model, projects, clients, tasks, and manual memory foundation.

### Project detail / record editing — PR #12
At the start of November 18:
- main was at commit d8989c6.
- PR #11 had already been merged.
- Project detail view lacked edit functionality for project details and project records.
- Branch feat/project-workspace-v2 implemented:
  - edit project name and description
  - change linked client
  - set due date
  - load clients scoped by workspace_id
  - update project by project ID and workspace ID
  - edit project record type/title/content/URL
  - preserve create/delete flows
  - add UI controls and CSS
- No DB migration required.
- Node engine set to 22.x.
- Added @supabase/storage-js override at 2.119.0 after dependency install trouble involving 2.119.1.
- CI TypeScript and production build passed; preview routes returned HTTP 200.
- PR #12 merged; production redeployed.
- Authenticated end-to-end CRUD was not claimed verified.

PR #12: https://github.com/Moizzshahid/studioDesk/pull/12

### Login, attachment, deletion, and UI phase — November 18
User feedback:
- Old purple login disliked.
- Login had Failed to fetch.
- User requested project deletion, documented attachments, notes, useful freelancing/work features.
- User noticed inconsistent icons and wanted unified premium design.
- User later approved the redesigned login and requested full code review and production readiness.
- Keep approved login design; do not revert to purple.
- Other app screens remain candidates for UI consistency/polish.

---

## 9. Current limitations and not-yet-verified items

Do not describe StudioDesk as fully production/client-ready until the following are tested or addressed.

### Manual browser verification — user will do this

Use a test account and non-sensitive temporary project:
1. Open production login.
2. Sign in.
3. Confirm dashboard loads.
4. Create a temporary client.
5. Create a temporary project linked to that client.
6. Edit project name, description, client link, due date.
7. Add project note/record.
8. Edit note and confirm persistence after refresh.
9. Create a task, edit, complete, reopen, delete.
10. Add Studio Memory item; search/filter/edit/delete.
11. Upload small allowed document (PDF or SVG).
12. Download/open it.
13. Delete document.
14. Delete temporary project and verify UI success.
15. If possible, simulate/retry cleanup after Storage failure without deleting real files.
16. Sign out/in and confirm data persists.

### Two-account tenant isolation
Use two independent test accounts/workspaces:
- Account A must not see or change Account B clients/projects/tasks/memories/records/attachments.
- Account B must not see or change Account A data.
- Private Storage download/upload must be workspace/project scoped.
- Test direct API requests or browser session behavior where practical, not just UI navigation.

### Other limitations
- Leaked-password protection disabled (user intentionally deferred).
- No independent security audit.
- No proven browser E2E test suite for all CRUD and storage flows.
- No robust global server-side search yet.
- Studio Memory manually authored, not AI-powered auto-memory.
- No client portal/invitation workflow.
- No full role management beyond initial roles.
- No complete notifications/calendar/reporting/approval workflow.
- No fully verified backup/restore and monitoring runbook.
- User wants a more premium and consistent overall UI after functionality is stable.

---

## 10. Local developer commands

Requirements: Node 22.x, npm, Supabase project and environment variables.

    git clone https://github.com/Moizzshahid/studioDesk.git
    cd studioDesk
    npm ci
    cp .env.example .env.local

Set only public browser credentials in .env.local:

    NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY

Commands:

    npm run dev
    npm run typecheck
    npm run build
    npm run start

Never add service-role credentials to client code or NEXT_PUBLIC_*.

CI workflow: .github/workflows/ci.yml
Expected steps: checkout, setup Node 22, npm ci, npm run typecheck, npm run build with placeholder Supabase build env values.

---

## 11. Active task as of November 19 — npm lockfile

User asked to defer leaked-password protection, fix missing lockfile, and create a detailed project handoff.

### Work performed
1. Confirmed package.json uses npm and Node 22.x; repository root had no package-lock.json.
2. Local container clone failed because it had no DNS/network access to GitHub.
3. Generated lockfile using temporary GitHub Actions workflow on branch fix/npm-lockfile:
   - npm install --package-lock-only --ignore-scripts --no-audit --no-fund
   - Workflow run ID 44523583180 completed successfully.
   - package-lock.json exists, lockfileVersion 3, approximately 37 KB.
4. Removed the temporary lockfile generator workflow.
5. Changed .github/workflows/ci.yml from npm install to npm ci.
6. Corrected docs/DEPLOYMENT.md:
   - now refers to all 11 migration files, including 0002b and 0010.
   - fixed malformed literal newline sequences in project deletion and attachment checklist.
7. Active branch: fix/npm-lockfile.
8. Latest observed branch head after sequential changes: a982ef819fafe3ac83bc981114769d0831d4c5a4 before this handoff file is committed.
9. PR for lockfile work has not yet been created at the time of this document.
10. CI for updated npm ci workflow has not yet been observed passing. Must wait for it and inspect jobs.
11. No production DB change is needed for lockfile.
12. No production deployment should be required for this package/CI/docs-only change, but merge to main will trigger normal Vercel Git deployment.

### Exact next steps
1. Refresh branch head for fix/npm-lockfile.
2. Check latest GitHub Actions run on branch.
3. Confirm CI used npm ci and both TypeScript and production build pass.
4. If npm ci fails, inspect full job logs, fix lockfile/package metadata, regenerate with Node 22/npm 10, rerun.
5. Inspect package-lock.json:
   - lockfileVersion 3
   - root dependencies match package.json
   - no unexpected private URLs/secrets.
6. Confirm generate-lockfile.yml is removed.
7. Confirm deployment docs migration list and checklist formatting.
8. Create PR to main describing lockfile v3, npm ci, docs correction.
9. Merge only if CI passes and diff is focused.
10. Verify main contains package-lock.json and CI uses npm ci.
11. Verify Vercel deployment after merge and /login and /projects return HTTP 200.
12. Do not claim authenticated workflows tested; user will test manually.
13. Ensure this handoff file itself is committed to main as part of this PR.

---

## 12. Product roadmap / future work

The user wants StudioDesk to become an advanced, genuinely useful application for freelancers and creative studios. Avoid adding everything in one uncontrolled PR.

### Reliability first
- Complete user browser CRUD test.
- Complete two-account tenant-isolation test.
- Test attachment upload/download/delete and cleanup retry.
- Add automated unit/integration/E2E tests.
- Review RLS and server-side validation.
- Add backup/restore and monitoring plan.
- Address leaked-password protection when affordable/available.

### Useful next capabilities (ideas, not shipped unless implemented and verified)
- Deliverable versions and revision history.
- Client feedback and approval workflow.
- Project milestones and timeline.
- Time tracking and billable hours.
- Proposals, estimates, invoices.
- Meeting notes and action items.
- Client communication log.
- Calendar and workload planning.
- Global search across projects, clients, records, and Studio Memory.
- Handover briefs and decision timelines.
- Notifications and reminders.
- Workspace invites and roles.
- Exports and account/data deletion.
- AI-assisted summaries and memory suggestions with explicit human review.

### UI quality pass
After functionality verified:
- Review dashboard, projects, project detail, tasks, clients, memory, attachments, navigation, forms, responsive mobile.
- Match approved premium login visual language.
- Establish consistent typography, spacing, border/radius, color tokens, surfaces, states, icon sizing/stroke, empty/loading/error states.
- Keep minimal and premium, not flashy or overdecorated.
- Never change approved login back to old purple split-screen.

---

## 13. Key links

- GitHub repository: https://github.com/Moizzshahid/studioDesk
- Production app: https://studiodesk-azonix.vercel.app
- Login: https://studiodesk-azonix.vercel.app/login
- Projects: https://studiodesk-azonix.vercel.app/projects
- PR #12: https://github.com/Moizzshahid/studioDesk/pull/12
- PR #14: https://github.com/Moizzshahid/studioDesk/pull/14
- PR #15: https://github.com/Moizzshahid/studioDesk/pull/15

---

## 14. Final status

StudioDesk is a real deployed Next.js + Supabase application with authentication, workspaces, clients, projects, tasks, project records, manual Studio Memory, activity, and private project attachments. It has undergone UI, functionality, and database hardening. Login redesign was explicitly approved by user. Project/record editing and project deletion/document cleanup were implemented. Storage RLS was tightened, exact queued deletion paths are required, SVG support restored, and dashboard counts corrected.

It is **not yet independently audited or fully browser-verified for real clients**. The user is about to test actual workflows manually. Keep that distinction clear.

Immediate priority: finish and merge npm lockfile branch after npm ci CI passes; then let user run real browser tests. Do not start a large feature build until user reports test results.
