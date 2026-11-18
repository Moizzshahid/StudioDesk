# StudioDesk

### The context-aware workspace for independent creative studios.

**Plan the work. Care for the relationships. Keep the thinking behind every decision.**

[![CI](https://github.com/Moizzshahid/studioDesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Moizzshahid/studioDesk/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

---

## Why StudioDesk?

Creative work loses momentum when its context is scattered across chats, documents, and people's memories. A client's preference is forgotten. A design decision gets repeated. A useful lesson disappears after hand-off.

StudioDesk brings day-to-day studio operations together with a searchable, human-curated knowledge layer called **Studio Memory**.

## Features

| Area | Current implementation |
| --- | --- |
| Authentication | Email/password sign-up and sign-in with Supabase Auth |
| Workspace | Signup-time personal workspace provisioning |
| Overview | Recent projects and tasks, exact workspace-wide open counts, clients, memories, and activity |
| Projects | Create, search, filter, edit details, set due dates, update status, delete with retryable document cleanup |
| Tasks | Create, edit, search, filter, assign project, set priority/due date, complete/reopen/delete |
| Clients | Create, search, edit, and delete contact records and internal notes |
| Studio Memory | Create, edit, search, filter, and delete human-authored context; optionally associate a project or client |
| Data access | Workspace-scoped PostgreSQL Row Level Security policies |
| Documents | Private project attachments with workspace/project-scoped storage access and retryable cleanup queue |
| Activity | Workspace-scoped activity timeline for project, task, memory and document actions |
| Interface | Responsive dashboard, navigation, forms, command search, and empty states |

### Studio Memory

Capture client preferences, brand guidelines, creative decisions, feedback, meeting notes, and lessons learned. In this release, memories are explicitly written by people. There is no AI-generated or automatically captured memory engine yet. Future AI suggestions should require human review and respect workspace permissions.

## Technology

- Next.js 15 App Router and React 19
- TypeScript (strict mode)
- Supabase Auth and PostgreSQL
- PostgreSQL Row Level Security
- Lucide React icons

## Quick start

### Requirements

- Node.js 22.x
- npm
- A Supabase project

### 1. Clone and install

```bash
git clone https://github.com/Moizzshahid/studioDesk.git
cd studioDesk
npm install
```

### 2. Configure environment

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Set the Supabase project URL and publishable/anon key:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Never expose a Supabase service-role key in browser code or a `NEXT_PUBLIC_*` variable. Never commit `.env.local`.

### 3. Create the database

In your Supabase project's SQL Editor, run:

all SQL files in `supabase/migrations/` in lexical filename order, including `0002b_move_security_helpers_to_private_schema.sql`

Do not apply only the first two files: later migrations add project records, activity writes, private documents, production hardening, and retryable storage cleanup. For an existing production project, compare `supabase_migrations.schema_migrations` with the repository before applying anything. Never reset or replay the initial schema over a database that contains user data.

### 4. Start the application

```bash
npm run dev
```

Open http://localhost:3000 and create an account. Depending on your Supabase Auth settings, email confirmation may be required before signing in.

### 5. Validate a production build

```bash
npm run typecheck
npm run build
npm run start
```

Set the same two public environment variables in your deployment provider and configure the production URL in Supabase Auth's allowed redirect/site URL settings.

## Deployment

See [Deployment guide](docs/DEPLOYMENT.md) for the Vercel + Supabase production setup checklist, required environment variables, Auth URL configuration, and post-deploy smoke tests.

## Repository structure

```text
studioDesk/
├── .github/                  # CI, Dependabot, issue and PR templates
├── app/
│   ├── (app)/
│   │   ├── clients/           # Client directory
│   │   ├── dashboard/         # Workspace overview
│   │   ├── memory/            # Human-curated Studio Memory (CRUD, search, filters)
│   │   ├── projects/          # Project management and document cleanup retry
│   │   ├── tasks/             # Task management
│   │   └── layout.tsx         # Authenticated shell
│   ├── login/                 # Sign-in and sign-up
│   ├── globals.css            # Responsive design system
│   ├── layout.tsx
│   └── page.tsx
├── components/                # Header, sidebar, app shell
├── docs/                      # Vision, architecture, roadmap, deployment
├── lib/                       # Supabase, workspace, activity, and storage cleanup helpers
├── supabase/migrations/       # Ordered, versioned database schema
├── .env.example
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Security notes

This is an early-stage self-hosted foundation, not an independently audited production SaaS. Before using real client data:

- Test workspace isolation with at least two independent accounts.
- Review every RLS policy and relational constraint.
- Keep service-role credentials server-side and out of browser bundles.
- Configure production auth URLs, backups, monitoring, and incident procedures.
- Run the documented authenticated smoke tests and two-account tenant-isolation checks before inviting a team.
- Configure leaked-password protection in Supabase Auth and review current Security Advisor findings.
- Keep a tested backup and recovery procedure; confirm pending storage cleanup jobs are empty.
- Do not store passwords, payment details, or highly sensitive personal data in Studio Memory.

Report suspected vulnerabilities privately using the contact guidance in [SECURITY.md](SECURITY.md).

## Development commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start local development |
| `npm run typecheck` | Run TypeScript validation |
| `npm run build` | Create production build |
| `npm run start` | Serve production build |

## Roadmap

1. Core workspace — authentication, projects, tasks, clients, and manual Studio Memory.
2. Client collaboration — invitations, client portal, deliverables, approvals, revision history.
3. Studio intelligence — cross-project search, handover briefs, AI-assisted summaries and human-approved memory suggestions.
4. Operations — activity feed, notifications, roles, calendar, reporting, exports, automated tests, and production observability.

Roadmap items are plans, not claims of shipped functionality. See [docs/ROADMAP.md](docs/ROADMAP.md).

## Contributing

Bug reports, product feedback, and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Keep changes focused, add new migrations for schema changes, and never commit secrets or real client data.

## License

MIT — see [LICENSE](LICENSE).

---

**StudioDesk** · An independent product by [Moiz](https://github.com/Moizzshahid)

*Make great work. Keep everything that makes it great.*
