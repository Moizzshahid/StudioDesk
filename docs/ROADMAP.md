# Product roadmap

This roadmap separates the current foundation from ideas that have not shipped. Scope may change as the product is tested with real studio workflows.

## Foundation — in the application codebase
- Email/password authentication via Supabase Auth
- Signup-time workspace provisioning
- Workspace-scoped PostgreSQL tables and RLS policies
- Dashboard summary
- Project creation, search, and status tracking
- Task creation and status/priority tracking
- Client directory and notes
- Human-authored Studio Memory with categories, search, and filtering

## Milestone 1 — reliability and security
- Automated component and integration tests
- Tenant-isolation tests using two or more workspaces
- Server-side validation and safer mutation boundaries
- Workspace-consistent relational constraints
- Error monitoring, structured logs, and backup/restore runbook
- Accessibility and responsive-layout audit

## Milestone 2 — client collaboration
- Invite clients with scoped access
- Client-facing project status page
- Deliverable uploads using private object storage
- Approve / request changes workflow
- Revision history and notification preferences

## Milestone 3 — Studio Memory intelligence
- Global search across projects, clients, and memories
- Project handover briefs and decision timelines
- Optional AI-assisted summaries
- Suggested memories with explicit human review and confirmation
- Workspace permission checks for every retrieval and generated result

## Milestone 4 — studio operations
- Activity timeline and notifications
- Workspace roles and member management
- Calendar and workload views
- Reports, exports, and account/data deletion workflows
- Production monitoring, rate limiting, and operational documentation

A roadmap item is shipped only after implementation, tests, documentation, and security review are complete. Listing an item here does not imply it exists in the current application.
