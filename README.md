# Moments

Share life's moments — monorepo containing the API, mobile app (Expo) and web app.

## Layout

```
apps/
  api/       NestJS REST API (skeleton lands in F5 / KAN-25)
  mobile/    Expo/React Native app (placeholder)
  web/       Web app (placeholder)
packages/
  types/     Shared domain types (@moments/types)
  db/        Database schema, migrations, seed (@moments/db)
  tsconfig/  Shared TypeScript presets
```

## Toolchain

- Node >= 22, pnpm 11 (`packageManager` field pins the version)
- TypeScript (strict), ESLint 9 (flat config), Prettier, Vitest
- CI: GitHub Actions runs `typecheck`, `lint`, `test`, `db:migrate`, `db:seed` on every PR and on pushes to `main`

## Commands

```bash
pnpm install          # install all workspace dependencies
pnpm typecheck        # tsc --noEmit across all packages
pnpm lint             # eslint across all packages
pnpm test             # vitest across all packages
pnpm db:migrate       # run database migrations
pnpm db:seed          # seed the database
```

## Workflow

- Branch per story: `feat/<TICKET>-<slug>` (e.g. `feat/KAN-23-scaffold`)
- Every PR must keep `pnpm typecheck && pnpm lint && pnpm test` green in CI
- Commit messages reference the Jira ticket, e.g. `KAN-23 scaffold monorepo`
