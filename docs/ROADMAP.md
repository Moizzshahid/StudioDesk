# Product roadmap

This roadmap distinguishes shipped capabilities from planned work. Scope may change as StudioDesk is tested in real studio workflows.

## In development — company workspaces

- Company profiles for ongoing client organizations.
- Company folders for recurring work and project grouping.
- Company- and folder-level notes, records, and private documents.
- Project association with a company and optional folder, while preserving independent projects and existing client contacts.

## Shipped foundation

Implemented in the current application codebase:

- Email/password authentication through Supabase Auth.
- Signup-time workspace provisioning and workspace-scoped PostgreSQL RLS.
- Dashboard with recent work, exact workspace-wide counts, and activity.
- Client directory with create, search, edit, and delete.
- Company profiles for ongoing client organizations, with contact details and shared context.
- Company folders to group recurring work by brand, campaign, service, or year.
- Company- and folder-level notes, records, and private documents.
- Projects linked to a company and optionally to one of its folders, while retaining independent projects and existing client contacts.
- Projects with create, search, filtering, status, due dates, client association, editing, and deletion.
- Project records for briefs, notes, decisions, meetings, links, deliverables, and updates.
- Tasks with project association, priority, due dates, editing, completion, reopening, and deletion.
- Human-authored Studio Memory with categories, search, filters, editing, and optional project/client associations.
- Workspace search and activity timeline.
- Private project attachments with workspace/project authorization and retryable Storage cleanup.
- Private company and folder attachments with workspace-scoped Storage authorization and cleanup-queue deletion.
- Responsive application shell and authentication screens.
- GitHub Actions CI, npm lockfile, Dependabot, issue templates, and contribution guidance.

Studio Memory is human-authored in the current release. AI-generated or automatically captured memory has not shipped.

## Milestone 1 — reliability and security

- Automated component, integration, and end-to-end regression tests.
- Repeatable automated tenant-isolation tests across multiple workspaces.
- Stronger server-side validation and mutation boundaries.
- Accessibility and responsive-layout audit.
- Error monitoring, structured logs, and backup/restore runbook.
- Review and resolve remaining Supabase Security Advisor findings, including leaked-password protection where the plan supports it.

## Milestone 2 — client collaboration

- Workspace invitations and member management.
- Client-facing project status and deliverable portal.
- Scoped client access and permissions.
- Approval and request-changes workflow.
- Deliverable revision history and notification preferences.

## Milestone 3 — Studio Memory intelligence

- Server-side global search across projects, clients, records, and memories.
- Project handover briefs and decision timelines.
- Optional AI-assisted summaries.
- Suggested memories with explicit human review and confirmation.
- Permission checks for every retrieval and generated result.

## Milestone 4 — studio operations

- Notifications and reminders.
- Calendar, milestones, and workload views.
- Time tracking and billable hours.
- Proposals, estimates, and invoices.
- Reports, exports, and account/data deletion workflows.
- Production monitoring, rate limiting, and operational documentation.

A roadmap item is shipped only after implementation, tests, documentation, and security review are complete. Listing an item here does not imply it exists in the current application.
