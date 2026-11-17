<div align="center">

# StudioDesk

### The context-aware workspace for independent creative studios.

**Plan the work. Care for the relationships. Keep the thinking behind every decision.**

[![CI](https://github.com/Moizzshahid/studioDesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Moizzshahid/studioDesk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

</div>

---

## Why StudioDesk?

Creative work often loses momentum when its context gets scattered across chats, documents, and people's memories. A client's preference is forgotten. A design decision gets repeated. A useful lesson disappears after hand-off.

StudioDesk brings day-to-day studio operations together with a searchable, human-curated knowledge layer called **Studio Memory**.

## Product capabilities

| Area | Included in this foundation |
| --- | --- |
| Workspace access | Email/password sign-up and sign-in with Supabase Auth |
| Workspace isolation | Workspace membership model and PostgreSQL Row Level Security policies |
| Overview | Snapshot of projects, open tasks, clients, and saved memories |
| Projects | Create, search, and track project status and due dates |
| Tasks | Create and organise work by status, priority, and due date |
| Clients | Keep client contact details and internal notes together |
| Studio Memory | Save, search, filter, and remove preferences, guidelines, decisions, feedback, lessons, and meeting notes |
| Interface | Responsive application shell and focused dashboard experience |

> **Product honesty:** this repository is an early, self-hostable product foundation. It is not a hosted SaaS, and it does not yet include client invitations, client-facing approvals, file delivery, billing, notifications, or AI-generated memory. See the [roadmap](docs/ROADMAP.md).

## The differentiator: Studio Memory

Studio Memory treats project context as a reusable studio asset. People can explicitly capture:

- Client preferences and communication expectations
- Brand guidelines and creative constraints
- Decisions and the reasoning behind them
- Feedback and revision patterns
- Lessons learned and meeting notes

Memories in this release are **written by people**. StudioDesk does not claim to have an AI memory engine, silently infer facts, or automatically store conversations. Future AI-assisted features must be permission-aware and require human confirmation before saving suggested knowledge.

## Technology

- **Application:** Next.js 15 App Router, React 19
- **Language:** TypeScript (strict mode)
- **Backend:** Supabase Auth and PostgreSQL
- **Data security:** PostgreSQL Row Level Security (RLS)
- **Icons:** Lucide React
- **Deployment target:** platforms that support Next.js, with a Supabase project

## Quick start

### Requirements

- Node.js 20.9 or newer
- npm
- A Supabase project

### 1. Get the code

```bash
git clone https://github.com/Moizzshahid/studioDesk.git
cd studioDesk
npm install
```

### 2. Configure Supabase

1. Create a project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open **Project Settings → API** (or the project's API keys page).
3. Copy the project URL and the publishable/anon key.
4. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

5. Add your values to `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

The browser-facing key is intended for client applications; database access must remain protected by RLS. **Never put a Supabase service-role key in a `NEXT_PUBLIC_*` variable or commit secrets.**

### 3. Apply the database schema

Open **SQL Editor** in your Supabase project and run:

```text
supabase/migrations/0001_initial_schema.sql
```

The initial migration creates the workspace, membership, client, project, task, memory, and activity tables; indexes; signup provisioning trigger; and RLS policies.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start a workspace. Depending on your Supabase Auth settings, email confirmation may be required before signing in.

### 5. Validate before deployment

```bash
npm run typecheck
npm run build
```

Configure the same two public Supabase environment variables in your hosting provider. Add the deployed URL to Supabase Auth's allowed redirect/site URL configuration before inviting real users.

## Repository map

```text
studioDesk/
├── .github/                 # CI, Dependabot, issue and PR templates
├── app/
│   ├── (app)/
│   │   ├── clients/         # Client directory
│   │   ├── dashboard/       # Workspace overview
│   │   ├── memory/          # Studio Memory knowledge base
│   │   ├── projects/        # Project management
│   │   ├── tasks/           # Task management
│   │   └── layout.tsx       # Authenticated application shell
│   ├── login/               # Sign-in and sign-up
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/              # Shared application shell and navigation
├── docs/                    # Product, architecture, and operations docs
├── lib/                     # Supabase client and workspace helpers
├── supabase/migrations/     # Versioned PostgreSQL schema
├── .env.example
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

See [architecture notes](docs/ARCHITECTURE.md), [product vision](docs/PRODUCT_VISION.md), and [roadmap](docs/ROADMAP.md) for more context.

## Security and privacy

StudioDesk is designed around workspace-scoped data access, but a schema and RLS policies are not a substitute for a security review. Before using real client or business data:

- Review every RLS policy and test access with at least two separate accounts/workspaces.
- Keep the Supabase service-role key server-side only; it is not needed by this client foundation.
- Configure production authentication URLs and email settings.
- Add server-side validation, abuse controls, audit logging, backup/restore procedures, and a privacy policy appropriate to your deployment.
- Do not store passwords, payment-card data, or highly sensitive personal information in Studio Memory.

Please report suspected vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run build` | Create a production Next.js build |
| `npm run start` | Serve the production build locally |

## Contributing

Contributions, thoughtful bug reports, and product feedback are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Keep changes focused, document schema changes with new migrations, and never commit credentials or real customer data.

## Roadmap

1. **Core workspace** — authentication, projects, tasks, clients, Studio Memory. *(Initial foundation in this repository.)*
2. **Client collaboration** — invitations, scoped client portal, deliverables, approvals, revision history.
3. **Studio intelligence** — cross-project search, handover briefs, AI-assisted summaries and user-approved memory suggestions.
4. **Operations** — activity feed, notifications, roles, calendar, reporting, exports, automated tests, and production observability.

Roadmap items are plans, not claims of shipped functionality. Follow [ROADMAP.md](docs/ROADMAP.md) for the current breakdown.

## License

Released under the [MIT License](LICENSE).

---

<div align="center">

**StudioDesk** · An independent product by [Moiz](https://github.com/Moizzshahid)

*Make great work. Keep everything that makes it great.*

</div>
