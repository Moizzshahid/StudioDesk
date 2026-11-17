# Architecture overview

## Runtime shape

StudioDesk is a Next.js App Router application. Interactive screens use the Supabase JavaScript client to authenticate the current user and read or mutate workspace records.

```text
Browser
  └── Next.js App Router
      ├── /login                 Supabase email/password auth
      └── authenticated routes  Dashboard / Projects / Tasks / Clients / Memory
               └── Supabase JS client
                    └── PostgreSQL + Row Level Security
```

## Data ownership
- `workspaces` is the tenant boundary.
- `workspace_members` maps authenticated users to workspaces and roles.
- `clients`, `projects`, `tasks`, `memories`, and `activity_events` carry a `workspace_id`.
- RLS policies use `is_workspace_member(workspace_id)` to scope data operations.
- A database trigger provisions a starter workspace and owner membership when an auth user is created.

## Studio Memory model
A memory has a title, body, category, optional project/client references, creator, and timestamps. Categories include `client_preference`, `brand_guideline`, `decision`, `feedback`, `lesson`, `meeting_note`, and `other`.

The Studio Memory route (`app/(app)/memory/page.tsx`) provides workspace-scoped list, create, edit, and delete flows, browser-side title/content search, category filtering, and optional project/client associations. The current search filters records loaded by the client; the PostgreSQL full-text index is a foundation for future server-side search. The UI is implemented in the repository, but live Supabase behavior and tenant isolation have not been end-to-end tested.

## Security boundaries and current limitations
This is an early-stage client-heavy foundation, not a completed security-certified multi-tenant service. RLS is essential and must remain enabled. Before production, validate tenant isolation with separate accounts, strengthen server-side input validation, review cross-tenant foreign-key relationships, add automated authorization tests, and establish operational controls. Do not add privileged service-role credentials to browser code.

## Database changes
1. Add a new, ordered SQL migration under `supabase/migrations/`.
2. Keep existing migrations immutable once shared with other environments.
3. Test the migration against a disposable Supabase project.
4. Test access as a member and as a user from another workspace.
5. Document setup or rollback implications in the pull request.
