# Changelog

Notable user-facing changes to StudioDesk are documented here. Dates use YYYY-MM-DD.

## Unreleased

- Documentation and public-repository polish.
- Live demo link and clearer self-hosting/security guidance.

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
