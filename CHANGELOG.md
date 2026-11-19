# Changelog

Notable user-facing changes to StudioDesk are documented here. Dates use YYYY-MM-DD.

## Unreleased

- Company/client folders as complete workspaces for projects, shared notes, documents, and Studio Memory.
- Projects can be assigned to a company folder or remain independent without a folder.

## [2.1.0] — 2026-11-19

### Added
- Studio Memory: human-authored, searchable knowledge records for client preferences, brand guidelines, decisions, feedback, lessons, and meeting notes.
- Client and project management, task tracking, project records, activity timeline, and workspace-wide search.
- Private project attachments with workspace-aware access controls and retryable storage cleanup.
- Signup-time workspace provisioning and PostgreSQL Row Level Security for tenant-scoped data.
- Updated public documentation, live demo link, contribution guidance, and security reporting policy.

### Improved
- Dashboard workspace-wide counts and project detail editing.
- Authentication and application shell experience.
- Deterministic dependency installation with npm lockfile v3 and npm ci in CI.
- Documentation for setup, migrations, deployment, architecture, and roadmap.

### Verification
- Maintainer-reported manual browser workflows and workspace-isolation checks passed on 2026-11-19.
- GitHub Actions typecheck and production build passed for the release preparation baseline.
- No independent security audit is claimed; automated end-to-end regression coverage remains planned.

## 2026-11-19 — Project foundation verified

- Added deterministic npm dependency installation with lockfile v3 and `npm ci` in CI.
- Completed project handoff and deployment documentation.
- Maintainer-reported manual browser workflow and workspace-isolation checks passed on the deployed application.
- Production deployment built from the merged `main` branch.

## 2026-11-18 — Workspace and storage hardening

- Added project detail and project-record editing.
- Added workspace-wide search and activity timeline.
- Added private project attachments and project deletion.
- Added retryable cleanup for private Storage objects.
- Tightened Storage authorization so object deletion is limited to queued cleanup paths.
- Corrected workspace-wide dashboard counts.
- Restored SVG document support to match the upload interface.
- Refined the application shell and authentication experience.

## Initial foundation

- Added Next.js App Router, React, and TypeScript application foundation.
- Added Supabase email/password authentication and workspace provisioning.
- Added dashboard, projects, tasks, clients, and human-authored Studio Memory.
- Added PostgreSQL Row Level Security and ordered database migrations.
- Added GitHub Actions CI, Dependabot, issue templates, and pull-request template.
- Added setup, architecture, deployment, security, contribution, and roadmap documentation.

For implementation details, see the [project handoff](docs/PROJECT_HANDOFF.md) and [roadmap](docs/ROADMAP.md).
