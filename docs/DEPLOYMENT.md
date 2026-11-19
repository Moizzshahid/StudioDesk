# Production deployment

StudioDesk is a Next.js application backed by Supabase. A successful GitHub build does not create a live app or configure its database. Complete these steps before inviting anyone to use it.

## 1. Prepare Supabase

1. Create a Supabase project.
2. For a new, empty project, apply every SQL file in `supabase/migrations/` in filename order (all 14 SQL files, `0001` through `0013`, including the separately named `0002b` migration). Never replay these initial migrations over a populated database. For an existing project, compare `supabase_migrations.schema_migrations` with the repository before applying anything.
3. In **Authentication → Providers**, enable Email/password sign-in.
4. Decide whether email confirmation is required. If enabled, configure the email provider and test the confirmation email.
5. In **Authentication → URL Configuration**, set the production Site URL to the final Vercel domain and add the local development URL plus any preview URLs you intend to use.
6. Copy the Project URL and the publishable key (or legacy anon key) from the project's API settings.

Do not use the service-role key in this browser application. Do not put it in a `NEXT_PUBLIC_*` variable.

## 2. Deploy on Vercel

1. Connect the GitHub account to Vercel and import `Moizzshahid/studioDesk`.
2. Keep the detected Next.js framework preset and the default build command (`npm run build`).
3. Add these environment variables for Production, Preview, and Development as appropriate:

   | Variable | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase publishable/anon key |

4. Deploy the `main` branch.
5. After the first deployment, copy the assigned Vercel URL and set it as the Supabase Auth Site URL. Add it to the allowed redirect URLs, then redeploy if environment variables changed.

## 3. Post-deploy smoke test

Use a test account and non-sensitive sample data:

- [ ] The home page sends signed-out visitors to Login.
- [ ] A new account can be created and, if enabled, email confirmation works.
- [ ] A confirmed user can sign in and reaches the dashboard.
- [ ] Signup creates one workspace and one owner membership.
- [ ] A client can be created, searched, edited, and deleted.
- [ ] A project can be created, edited, assigned to a client, and its status changed.
- [ ] Project deletion removes database records and private files; simulate a Storage failure and verify the cleanup job remains retryable.
- [ ] Project attachment upload, download, deletion, and workspace/project authorization work.
- [ ] Company/client folders can be created and edited with profile details, notes, documents, memories and linked projects.
- [ ] Projects can be created independently or assigned to a company/client folder; folder association can be changed from project details.
- [ ] Deleting a company/client folder keeps linked projects as unfiled projects and cleans up folder documents.
- [ ] Tasks can be created, completed, reopened, and deleted.
- [ ] Studio Memory can be created, searched, edited, filtered, and deleted.
- [ ] Sign out returns the user to Login.
- [ ] A second test account cannot read or modify the first account's workspace data.

## 4. Production readiness

CI verifies TypeScript and the Next.js production build; it does not prove authenticated workflows. The maintainer reports that the documented manual browser workflows and workspace-isolation checks passed on the deployed application on 2026-11-19. The current production deployment is built from `main` at commit `01c2237`. Re-run these checks for each deployment that changes authentication, authorization, database schema, or Storage behavior.

Before handling real client data in a self-hosted instance, configure backups and monitoring, review all Supabase Security Advisor findings, and confirm private file access and cleanup behavior. Leaked-password protection is a known deferred item for the maintainer's deployment; enable it when the available plan supports it. Manual testing is not an independent security audit.

Never commit `.env.local`, real client data, access tokens, or service-role credentials.
