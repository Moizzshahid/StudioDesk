# Security policy

## Supported version
The `main` branch is the only development line currently maintained. No stable production release has been declared.

## Reporting a vulnerability
Please do not publish exploitable vulnerability details in a public issue. Contact the repository owner through the private contact options on the [GitHub profile](https://github.com/Moizzshahid) and include a concise description, potential impact, affected routes or tables, and reproduction steps using test accounts and synthetic data.

Please allow time for investigation before public disclosure. Do not access, modify, or retain data that does not belong to you while researching a suspected issue.

## Deployment security notes
- Keep Row Level Security enabled on tenant-owned tables.
- Never expose Supabase service-role credentials in browser bundles or public environment variables.
- Use separate development and production Supabase projects.
- Configure authentication redirect URLs deliberately.
- Test cross-workspace access boundaries before handling real client data.
- Keep dependencies updated and review deployment logs for exposed secrets.

StudioDesk is an early-stage project. This policy is not a claim that the application has undergone an independent security audit.
