# Architecture overview

## Runtime shape

StudioDesk is a Next.js App Router application. Interactive screens use the Supabase JavaScript client to authenticate the current user and read or mutate workspace records.

```text
Browser
  └── Next.js App Router
      ├── /login                 Supabase email/password auth
      └── authenticated routes  Dashboard / Projects / Folders / Tasks / Clients / Memory
               ├── Project folders and project organization
               ├── Project records and private attachments
               ├── Workspace search and activity timeline
               └── Supabase JS client
                    └── PostgreSQL + Row Level Security
                         └── Private Supabase Storage bucket
```

## Data ownership
- `workspaces` is the tenant boundary.
- `workspace_members` maps authenticated users to workspaces and roles.
- `clients`, `projects`, `folders`, `folder_records`, `folder_attachments`, `tasks`, `memories`, and `activity_events` carry a `workspace_id`.
- RLS policies use `is_workspace_member(workspace_id)` to scope data operations.
- A database trigger provisions a starter workspace and owner membership when an auth user is created.

## Studio Memory model
A memory has a title, body, category, optional project/client/folder references, creator, and timestamps. A folder represents a company/client workspace; it can contain projects, notes, documents, and shared memories. Projects can also remain independent with no folder. Categories include `client_preference`, `brand_guideline`, `decision`, `feedback`, `lesson`, `meeting_note`, and `other`.

The Studio Memory route (`app/(app)/memory/page.tsx`) provides workspace-scoped list, create, edit, and delete flows, browser-side title/content search, category filtering, and optional project/client associations. The current memory search filters records loaded by the client; the PostgreSQL full-text index is a foundation for future server-side search. The maintainer reported that manual browser workflows and workspace-isolation checks passed on the deployed application on 2026-11-19. These manual checks do not constitute an independent security audit or automated regression suite.

## Security boundaries and current limitations
This is an early-stage, client-heavy multi-tenant application, not a security-certified service. RLS is essential and must remain enabled. Continue strengthening server-side input validation, reviewing cross-tenant foreign-key relationships, adding automated authorization tests, and establishing operational controls. Manual workspace-isolation checks have been reported as passing; repeat them after authorization or schema changes. Do not add privileged service-role credentials to browser code.


## How workspace isolation works

Every tenant-owned row carries a `workspace_id`. The authenticated user's identity comes from the Supabase Auth JWT via `auth.uid()`; the browser does not get to choose which user identity the database trusts.

The private helper `private.is_workspace_member(target_workspace)` checks whether a row's workspace has a matching row in `public.workspace_members` for the current `auth.uid()`. It is a stable SQL `SECURITY DEFINER` function with an empty `search_path`, and its execute permission is granted only to the authenticated role. The helper lives in the non-exposed `private` schema rather than the public API schema.

For example, the policy on `public.projects` is conceptually:

```sql
create policy "Members manage workspace projects"
on public.projects
for all to authenticated
using (private.is_workspace_member(workspace_id))
with check (private.is_workspace_member(workspace_id));
```

- `USING` filters which existing rows the current user can select, update, or delete. A row belonging to a workspace where the current user has no membership does not pass the predicate.
- `WITH CHECK` validates the resulting row on inserts and updates, so a client cannot create a row in another workspace or move an existing row into one.
- Related records are additionally checked: project client/folder references, task project references, and memory project/client/folder references must resolve inside the same workspace. Composite foreign keys reinforce same-workspace relationships at the database level.
- Signup provisioning creates a workspace and owner membership for the new auth user using a database trigger. The browser cannot create its own trusted membership simply by submitting a workspace ID.

This is defense in depth, not a claim of perfect security. Every new tenant-owned table, view, RPC, Storage policy, and relationship must receive its own review. RLS must remain enabled, and isolation should be regression-tested using two independent accounts against a disposable test database. The source of truth for the helper and policies is `supabase/migrations/0002b_move_security_helpers_to_private_schema.sql`; folder and Storage rules are extended in later migrations.

## Database changes

1. Add a new, ordered SQL migration under `supabase/migrations/` (company/client folder workspaces are introduced in migration `0012_project_folders.sql`; supporting relationship indexes are in `0013_folder_workspace_indexes.sql`).
2. Keep existing migrations immutable once shared with other environments.
3. Test the migration against a disposable Supabase project.
4. Test access as a member and as a user from another workspace.
5. Document setup or rollback implications in the pull request.
