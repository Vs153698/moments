# AGENTS.md — Moments

Instructions for AI coding agents (and humans) working in this repository.

## What this is

Moments — a social moments-sharing platform. Turborepo + pnpm monorepo:

```
apps/
  api/       NestJS REST API (skeleton: F5 / KAN-25)
  mobile/    Expo / React Native app (placeholder)
  web/       Web app (placeholder)
packages/
  config/    Shared tsconfig / ESLint / Prettier configs (@moments/config)
  types/     Shared domain types (@moments/types)
  db/        Database schema, migrations, seed (@moments/db)
docs/
  spec.md    Product & engineering spec export
```

## Commands

```bash
pnpm install          # install workspace dependencies
pnpm typecheck        # tsc --noEmit across all packages (turbo)
pnpm lint             # eslint across all packages (turbo)
pnpm test             # vitest across all packages (turbo)
pnpm format:check     # prettier check
pnpm db:migrate       # database migrations (packages/db)
pnpm db:seed          # seed the database
```

## Rules

1. **Keep `pnpm typecheck && pnpm lint && pnpm test` green.** CI runs it on every PR.
2. **Import boundaries:** `apps/*` may import from `packages/*`; `packages/*` must never import from `apps/*`. Enforced by eslint-plugin-boundaries.
3. **Commits:** Conventional Commits, enforced by a husky commit-msg hook (commitlint). Reference the Jira ticket in the subject, e.g. `feat(api): add health endpoint [KAN-97]`.
4. **Types:** strict TypeScript everywhere (`packages/config/tsconfig.base.json`). No `any` without a comment justifying it.
5. **Testing:** every new module ships with vitest tests next to the source (`*.test.ts`). Run `pnpm test` before pushing.
6. **Env & secrets:** never commit secrets. Copy `.env.example` to `.env` locally (see docs/ENVIRONMENTS.md, F8 / KAN-27).
7. **PRs:** use the PR template; require green CI before merge.

## Workflow

- Branch per ticket: `feat/KAN-XX-slug`.
- Jira: move ticket In Progress before starting; comment with test results when done; move to Done only after CI is green.

## Key conventions

- API base path `/v1`; health endpoint `/v1/health` (F5).
- Moment privacy levels: `public | invite_only | private` (packages/types).
- Database migrations and seed live in `packages/db` and must run with `pnpm db:migrate && pnpm db:seed` on a fresh machine.
