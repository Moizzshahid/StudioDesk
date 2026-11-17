# Contributing to StudioDesk

Thanks for taking an interest in StudioDesk. Contributions should improve a real studio workflow while keeping the product clear, dependable, and respectful of client data.

## Before you start
- Search existing issues before opening a new one.
- For substantial changes, open an issue first to discuss scope and design.
- Do not include secrets, private client material, or personal data in issues, commits, screenshots, or test fixtures.

## Local setup
Follow the [README quick start](README.md#quick-start). Use a disposable Supabase project for schema and integration work.

## Pull request expectations
- Keep pull requests focused and explain the user problem they solve.
- Include screenshots for meaningful UI changes.
- Add or update tests when behavior changes.
- Run `npm run typecheck` and `npm run build` when dependencies and environment are available.
- Document new environment variables and setup steps.
- Add a new ordered SQL migration for schema changes; do not silently rewrite a migration already used by another environment.
- Verify workspace isolation for any new table, query, or mutation.
- Never commit `.env.local`, API keys, service-role keys, or real user data.

## Commit messages
Use short, imperative messages. Conventional Commit prefixes are welcome: `feat:`, `fix:`, `docs:`, and `test:`.

## Code style
- Prefer clear names and small, cohesive components.
- Keep TypeScript strict; avoid introducing `any` where a useful type can be defined.
- Keep user-facing copy calm, direct, and specific.
- Treat authorization as a backend/database responsibility, not merely a hidden UI element.

By submitting a contribution, you agree that it may be distributed under the repository's MIT license.
