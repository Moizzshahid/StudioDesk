# Security policy

## Supported version
The `main` branch is the only development line currently maintained. The application is deployed to production on Vercel, but no tagged GitHub Release is currently published. Until a tagged release is published, use the current `main` branch as the maintained version.

## Reporting a vulnerability

Please do not publish exploitable vulnerability details in a public issue or discussion. Contact the repository owner privately through the contact options on the [GitHub profile](https://github.com/Moizzshahid). Include:

- A concise description and potential impact.
- Affected routes, components, tables, or policies, if known.
- Reproduction steps using only your own test account and synthetic data.
- Any suggested mitigation.

Do not include passwords, access tokens, service-role keys, private client files, or other secrets in a report. Do not access, modify, download, or retain data that does not belong to you. Please allow the maintainer reasonable time to investigate and coordinate a fix before public disclosure. This is a maintainer-operated project; response times are not guaranteed.

## Deployment security notes
- Keep Row Level Security enabled on tenant-owned tables.
- Never expose Supabase service-role credentials in browser bundles or public environment variables.
- Use separate development and production Supabase projects.
- Configure authentication redirect URLs deliberately.
- Test cross-workspace access boundaries before handling real client data.
- Keep dependencies updated and review deployment logs for exposed secrets.

StudioDesk is an early-stage project. This policy is not a claim that the application has undergone an independent security audit.
