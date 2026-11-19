# StudioDesk

### A context-aware workspace for independent creative studios.

**Plan the work. Care for the relationships. Keep the thinking behind every decision.**

[![CI](https://github.com/Moizzshahid/StudioDesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Moizzshahid/StudioDesk/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/Live%20demo-Open%20StudioDesk-111827?logo=vercel)](https://studiodesk-delta.vercel.app)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

---

## What it does

StudioDesk brings a small creative studio's daily work and its working context into one workspace.

- **Projects & briefs** — organize work, track status and due dates, attach project records, and keep project files together.
- **Company folders** — group a client's or company's projects, notes, documents, and shared context in one place. Independent projects are supported too.
- **Tasks** — create, prioritize, assign to projects, complete, reopen, and search tasks.
- **Clients** — keep client contact details and internal notes.
- **Studio Memory** — save and search human-written preferences, brand guidelines, decisions, feedback, and meeting notes.
- **Private documents** — store project and folder attachments in a private Supabase Storage bucket.
- **Activity** — review workspace-scoped activity.

Studio Memory is human-authored in this version. The application does not silently generate or save AI memories.

## Technology

- Next.js 15 App Router, React 19, TypeScript
- Supabase Auth and PostgreSQL
- PostgreSQL Row Level Security (RLS)
- Supabase Storage
- Vercel hosting and GitHub Actions CI

## Live demo

**[Open StudioDesk](https://studiodesk-delta.vercel.app)**

This is a live deployment for product evaluation. Use synthetic test data only; do not enter confidential client information.

## Run locally

### Requirements

- Node.js 22.x
- npm
- A Supabase project

### 1. Clone and install

```bash
git clone https://github.com/Moizzshahid/StudioDesk.git
cd StudioDesk
npm ci
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable/anon key:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Never put a Supabase service-role key in browser code or a `NEXT_PUBLIC_*` variable. Never commit `.env.local`.

### 3. Set up the database

For a **new, empty** Supabase project, apply every SQL migration in `supabase/migrations/` in lexical filename order. For an existing database, compare its migration history with the repository first. Never reset a populated database or replay the initial schema over production data.

Configure the production Site URL and allowed redirect URLs in Supabase Auth before deploying.

### 4. Start the app

```bash
npm run dev
```

Open http://localhost:3000.

### 5. Validate

```bash
npm run typecheck
npm run build
npm run start
```

## Security and testing

StudioDesk uses workspace-scoped PostgreSQL RLS as its tenant boundary. RLS is essential: do not disable it or expose service-role credentials to the browser.

The maintainer reports completing manual browser CRUD and two-account workspace-isolation checks on 2026-11-19. Those are maintainer-reported checks, not an independent security audit or an automated end-to-end test suite. File upload/download/deletion and retryable cleanup must be rechecked against a disposable test workspace before relying on them with real client files.

See [SECURITY.md](SECURITY.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), and the [manual verification checklist](docs/TESTING.md). A two-account RLS regression script is available as `npm run test:rls`; run it only against a disposable Supabase project with two dedicated test accounts. Configure the six `TEST_*` / `SUPABASE_*` repository secrets listed in [the integration workflow](.github/workflows/rls-integration.yml) before running that workflow.

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run typecheck` | TypeScript validation |
| `npm run build` | Production build |
| `npm run start` | Run the production build |

Changes to the database require a new ordered migration. Do not edit migrations that have already been applied to shared or production environments.

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Do not submit credentials, real client files, or private user data.

## Development transparency

StudioDesk was developed with AI-assisted coding tools as part of the development workflow. Product direction, feature decisions, repository changes, and final acceptance remain the maintainer's responsibility.

## License

MIT — see [LICENSE](LICENSE).

---

**StudioDesk** · An independent product by [Moiz](https://github.com/Moizzshahid)

*Make great work. Keep everything that makes it great.*
