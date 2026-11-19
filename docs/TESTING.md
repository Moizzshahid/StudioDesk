# StudioDesk verification checklist

This checklist is for a disposable test environment and synthetic data. Never use real client records or files. The maintainer reported completing manual CRUD and two-account isolation checks on 2026-11-19; repeat these checks after changes to authentication, RLS, migrations, or Storage.

## Test setup

1. Use a separate Supabase project for testing, not the production database.
2. Apply the repository migrations to that empty test project.
3. Configure a preview deployment or local app with the test project's public URL and publishable/anon key.
4. Create two independent test accounts, **Account A** and **Account B**. Confirm each signup provisions its own workspace.
5. Use unique synthetic names such as `A-Project-001` and `B-Project-001`.

## Workspace isolation

While signed in as Account A:

- [ ] Create a client, project, task, folder, Studio Memory entry, and project/folder document.
- [ ] Record the generated IDs and filenames for the test data.
- [ ] Confirm all records appear in Account A's workspace.

Sign out and sign in as Account B:

- [ ] Confirm Account B cannot see Account A's clients, projects, tasks, folders, memories, activity, or document metadata.
- [ ] Attempt direct reads of Account A record IDs through the normal authenticated client; expect no rows or an authorization error.
- [ ] Attempt updates and deletes against Account A record IDs; confirm Account A's data remains unchanged.
- [ ] Attempt to access Account A's private Storage object using Account B's authenticated session; access must be denied.
- [ ] Create equivalent B-prefixed records and confirm Account B can access only its own data.

Sign back in as Account A and verify its records and files remain intact.

## CRUD regression

For each account independently:

- [ ] Clients: create, search, edit, and delete.
- [ ] Projects: create, edit title/brief/status/due date/client, and delete.
- [ ] Project records: create, edit, and delete notes/briefs/decisions/meetings/links/deliverables/updates.
- [ ] Tasks: create, edit, search/filter, complete, reopen, and delete.
- [ ] Folders: create/edit profile, add notes, link projects, and delete a folder while confirming linked projects follow the documented unfiled-project behavior.
- [ ] Studio Memory: create, search/filter, edit, associate with a project/client/folder where supported, and delete.
- [ ] Activity: verify expected events appear and remain workspace-scoped.

## File lifecycle

Use harmless synthetic files only:

- [ ] Upload an allowed file to a project and a folder.
- [ ] Download each file while signed in as its owner.
- [ ] Confirm the other account cannot download either file.
- [ ] Delete an attachment and verify metadata and Storage object cleanup.
- [ ] Delete a project/folder with attached files and verify cleanup behavior.
- [ ] In the disposable test environment only, simulate a Storage cleanup failure and verify the cleanup job remains retryable; retry and confirm it completes.
- [ ] Confirm unsupported MIME types and files above the configured size limit are rejected.

## Release checks

- [ ] `npm ci` succeeds from a clean checkout.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm run build` succeeds.
- [ ] GitHub Actions CI passes on the release commit.
- [ ] Preview deployment and authenticated smoke checks pass.
- [ ] Confirm package.json and package-lock.json versions match the release tag.
- [ ] Confirm a GitHub Release exists and points to the intended tag.

## Evidence and limits

Record the date, commit SHA, environment (local/preview), test accounts used (never their passwords), pass/fail status, and any defect. Do not describe a test as passed unless it was actually executed.

The current CI workflow checks TypeScript and builds the Next.js app. This checklist is manual guidance; it is not an automated Playwright suite. Manual checks do not constitute an independent security audit.
