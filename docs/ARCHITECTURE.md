# Architecture overview

## Runtime shape

StudioDesk is a Next.js App Router application. Interactive screens use the Supabase JavaScript client to authenticate the current user and read or mutate workspace records.

```text
Browser
  └── Next.js App Router
      ├── /login                 Supabase email/password auth
      └── authenticated routes  Dashboard / Projects / Tasks / Clients / Memory
               ├── Project records and private attachments
               ├── Workspace search and activity timeline
               └── Supabase JS client
                    └── PostgreSQL + Row Level Security
                         └── Private Supabase Storage bucket
```

## Data ownership
- `workspaces` is the tenant boundary.
- `workspace_members` maps authenticated users to workspaces and roles.
- `clients`, `projects`, `tasks`, `memories`, and `activity_events` carry a `workspace_id`.
- RLS policies use `is_workspace_member(workspace_id)` to scope data operations.
- A database trigger provisions a starter workspace and owner membership when an auth user is created.

## Studio Memory model
A memory has a title, body, category, optional project/client references, creator, and timestamps. Categories include `client_preference`, `brand_guideline`, `decision`, `feedback`, `lesson`, `meeting_note`, and `other`.

The Studio Memory route (`app/(app)/memory/page.tsx`) provides workspace-scoped list, create, edit, and delete flows, browser-side title/content search, category filtering, and optional project/client associations. The current memory search filters records loaded by the client; the PostgreSQL full-text index is a foundation for future server-side search. The maintainer reported that manual browser workflows and workspace-isolation checks passed on the deployed application on 2026-11-19. These manual checks do not constitute an independent security audit or automated regression suite.

## Security boundaries and current limitations
This is an early-stage, client-heavy multi-tenant application, not a security-certified service. RLS is essential and must remain enabled. Continue strengthening server-side input validation, reviewing cross-tenant foreign-key relationships, adding automated authorization tests, and establishing operational controls. Manual workspace-isolation checks have been reported as passing; repeat them after authorization or schema changes. Do not add privileged service-role credentials to browser code.

## Database changes
1. Add a new, ordered SQL migration under `supabase/migrations/`.
2. Keep existing migrations immutable once shared with other environments.
3. Test the migration against a disposable Supabase project.
4. Test access as a member and as a user from another workspace.
5. Document setup or rollback implications in the pull request.
