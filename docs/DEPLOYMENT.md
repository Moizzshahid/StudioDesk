# Production deployment

StudioDesk is a Next.js application backed by Supabase. A successful GitHub build does not create a live app or configure its database. Complete these steps before inviting anyone to use it.

## 1. Prepare Supabase

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/migrations/0001_initial_schema.sql` once on the new, empty project.
3. In **Authentication → Providers**, enable Email/password sign-in.
4. Decide whether email confirmation is required. If enabled, configure the email provider and test the confirmation email.
5. In **Authentication → URL Configuration**, set the production Site URL to the final Vercel domain and add the local development URL plus any preview URLs you intend to use.
6. Copy the Project URL and the publishable/anon key from the project's API settings.

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
- [ ] A project can be created and its status changed.
- [ ] Tasks can be created, completed, reopened, and deleted.
- [ ] Studio Memory can be created, searched, edited, filtered, and deleted.
- [ ] Sign out returns the user to Login.
- [ ] A second test account cannot read or modify the first account's workspace data.

## 4. Production readiness

The repository CI currently verifies TypeScript and the Next.js production build. That is not a substitute for the smoke tests above. Before real client data is stored, add automated authorization tests, test tenant isolation, configure backups and monitoring, and review the RLS policies. StudioDesk should be treated as an early-stage application until those checks have been completed.

Never commit `.env.local`, real client data, access tokens, or service-role credentials.
