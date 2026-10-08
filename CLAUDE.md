# CLAUDE.md — Moments

> Same instructions as AGENTS.md — read that first. Quick reference below.

- Monorepo: Turborepo + pnpm (`apps/api`, `apps/mobile`, `apps/web`, `packages/*`).
- Always run before pushing: `pnpm typecheck && pnpm lint && pnpm test`.
- Boundaries: apps → packages only. Commits: Conventional Commits (`type(scope): subject [KAN-XX]`), enforced by husky/commitlint.
- DB: `pnpm db:migrate && pnpm db:seed` (packages/db).
- Full details: [AGENTS.md](./AGENTS.md) · spec: [docs/spec.md](./docs/spec.md).
