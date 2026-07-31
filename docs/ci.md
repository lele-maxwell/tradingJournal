# Continuous Integration

This project uses GitHub Actions for continuous integration. The workflow lives at [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Triggers

The CI workflow runs on:

- **`push`** to `main`
- **`pull_request`** targeting `main`

Superseded runs on the same ref are cancelled automatically (concurrency group keyed by workflow + ref).

## Checks

The pipeline runs three quality gates, in order, on `ubuntu-latest` with Node.js 20 LTS:

1. **Lint** — `npm run lint` (ESLint via `eslint-config-next`)
2. **Typecheck** — `npm run typecheck` (`tsc --noEmit`)
3. **Build** — `npm run build` (`next build`)

Before the checks run, dependencies are installed with `npm ci` and the Prisma client is generated with `npx prisma generate`.

## Reproducing locally

Mirror the CI pipeline from your machine with:

```bash
npm ci
npx prisma generate
npm run lint
npm run typecheck
npm run build
```

If you have already installed dependencies, `npm install` works in place of `npm ci`.

## Environment variables in CI

The workflow sets the following placeholder values at the job level so the build and Prisma client generation succeed without real secrets:

| Variable | Purpose |
| --- | --- |
| `NEXT_TELEMETRY_DISABLED=1` | Disables Next.js anonymous telemetry. |
| `DATABASE_URL` | Dummy Postgres connection string consumed by Prisma. |
| `NEXT_PUBLIC_SUPABASE_URL` | Placeholder Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Placeholder Supabase anon key. |

These are syntactically valid but point at nothing — they exist only so static analysis and the build do not crash on missing env vars. Any check that requires live credentials must be added as its own job (or skipped in CI) and not bolted onto this one.

## Pinned action versions

External actions are pinned to major versions:

- `actions/checkout@v4`
- `actions/setup-node@v4`

Bump these when GitHub publishes a new major and the release notes have been reviewed.

## Extending the pipeline

When the project gains a test runner (Jest, Vitest, Playwright, etc.), add a step after `typecheck` and before `build`:

```yaml
- name: Test
  run: npm test
```

For longer-running suites, consider splitting them into a separate job that runs in parallel with the build. Keep the existing `ci` job as the fast-feedback gate.

Out of scope for this workflow:

- Deployment / release automation
- Dependabot or other dependency-update bots
- Branch protection rules (these are configured in repo settings, not in code)
