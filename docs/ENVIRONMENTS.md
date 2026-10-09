# Environments & Third-Party Accounts (F8 / KAN-27)

Environment matrix, per-service variables, secrets policy, and the full
spec §6.2 account checklist with current status.

## Environment matrix

| Environment | Purpose | API host | DB | Redis | Mobile build | Web |
|---|---|---|---|---|---|---|
| `local` / `development` | Dev on developer machines | `localhost:3000` (Docker: `localhost:3100`) | local Postgres 17 + PostGIS (`docker-compose.yml`) | local Redis 7 | Expo dev client | `pnpm dev` |
| `preview` | Per-PR review environments | Railway PR environment | Neon branch (PR branch) | Railway PR Redis | EAS `preview` internal | Vercel preview deployment |
| `staging` | Pre-release, TestFlight / Play internal | Railway `staging` service | Neon `staging` branch | Railway Redis | EAS `staging` → TestFlight + Play internal | Vercel `staging` (prod branch = `staging`) |
| `production` | Live | Railway `production` service | Neon `main` (PITR enabled) | Railway Redis | EAS `production` store tracks | Vercel production (branch `main`) |

Branching rule: short-lived work branches → `main` via squash PR; `staging`
is a long-lived branch that deploys to the staging environment; tags `v*` cut
production releases from `main`.

## Service variables (per environment)

All API variables are validated by `apps/api/src/config/env.ts` (zod). Copy
`.env.example` → `.env` locally; hosted values live in the secrets manager.

### API (Railway)

| Variable | local | preview/staging/production | Notes |
|---|---|---|---|
| `NODE_ENV` | `development` | `preview` / `staging` / `production` | drives sampling + log level |
| `PORT` | `3000` | set by platform | Railway injects `$PORT` |
| `DATABASE_URL` | docker-compose Postgres | Neon pooled connection string | Neon branch per env |
| `REDIS_URL` | docker-compose Redis | Railway Redis service URL | TLS in hosted envs |
| `APP_VERSION` | `0.1.0` | release tag | shown in `/v1/health` |
| `LOG_LEVEL` | `debug` | `info` | |
| `SENTRY_DSN` | optional | per-env DSN (same project, filtered by `environment`) | F5 init, F8 verified |
| `POSTHOG_KEY` | optional | per-env project key | F8 wiring |
| `POSTHOG_HOST` | optional | `https://us.i.posthog.com` (EU: `https://eu.i.posthog.com`) | |
| `BETTERSTACK_SOURCE_TOKEN` | optional | per-env log source token | drains JSON logs |

### Web (Vercel)

`NEXT_PUBLIC_API_URL` (per env: localhost / preview URL / staging / prod).

### Mobile (EAS)

`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_SENTRY_DSN`,
`EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST` — set per EAS build
profile (see `apps/mobile/eas.json`). `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is
required for the `expo-auth-session` Google sign-in flow (KAN-33).

## Secrets policy

- **Single source of truth: Doppler** (project `moments`, configs
  `dev` / `stg` / `prd`). Railway, Vercel, and EAS read from Doppler via the
  official Doppler integrations — no secrets are stored in CI variables,
  repo files, or `.env` files committed to git.
- Until Doppler is provisioned (owner task), GitHub **Environments**
  (`preview` / `staging` / `production`) hold CI-only secrets; runtime secrets
  are entered directly in the Railway/Vercel dashboards and marked "migrate to
  Doppler" in this doc.
- Local development uses `.env` (git-ignored); `.env.example` documents every
  variable with safe placeholders.
- Rotation: Neon/Railway/Redis URLs rotate per environment on any incident;
  DLT/API keys rotate on personnel change.

## Spec §6.2 account checklist — status

> **Legend:** ✅ created & verified · ⬜ pending owner action (needs billing /
> identity / phone verification) · 🔧 configured in repo, awaiting account

| # | Account | Spec ref | Status | Notes |
|---|---|---|---|---|
| 1 | GitHub org `moments` + repo | 6.2.1 | ✅ | github.com/Vs153698/moments, CI via GitHub Actions |
| 2 | Neon (Postgres 17 + PostGIS) | 6.2.2 | ⬜ owner | Free tier; create project + `main` branch, enable pooled connections; create `staging` branch |
| 3 | Railway (API, Redis, worker) | 6.2.3 | 🔧 `railway.toml` in repo; account ⬜ owner | Create project, add Postgres/Redis plugins or use Neon; map `staging`/`production` services to branches |
| 4 | Vercel (web) | 6.2.4 | 🔧 `apps/web/vercel.json` in repo; account ⬜ owner | Framework preset "Other" until web app lands in E14 |
| 5 | Doppler (secrets) | 6.2.5 | ⬜ owner | Project `moments`, configs dev/stg/prd, integrations to Railway/Vercel/EAS |
| 6 | Sentry | 6.2.6 | 🔧 wired (API); account ⬜ owner | Create project `moments-api`, copy DSN per env; mobile/web SDKs land with F7/E14 code |
| 7 | PostHog | 6.2.7 | 🔧 wired (API); account ⬜ owner | Create project, copy key + host per env |
| 8 | Better Stack (logs + uptime) | 6.2.8 | 🔧 wired (API log drain); account ⬜ owner | Create source per env, copy ingest token; uptime monitor → `/v1/health` |
| 9 | MSG91 (SMS + DLT) | 6.2.9 | 🔧 templates drafted in `docs/DLT.md`; registration ⬜ owner | **DLT entity + template registration submitted first — 3–7 working days** |
| 10 | Apple Developer Program | 6.2.10 | ⬜ owner | $99/yr; needed for TestFlight staging build |
| 11 | Google Play Console | 6.2.11 | ⬜ owner | $25 one-time; needed for Play internal track |
| 12 | Expo / EAS | 6.2.12 | 🔧 `eas.json` profiles in repo; account ⬜ owner | `development`, `preview`, `staging` (internal), `production` |

### Owner order of operations (unblocks the most downstream work first)

1. **MSG91 DLT entity + template submission** (longest lead time — start today;
   copy-ready templates in `docs/DLT.md`).
2. Apple Developer + Google Play Console (needed for the staging build
   acceptance item; enrollment review can take days).
3. Neon → Railway → Vercel → Doppler (fast; minutes each once billing is set).
4. Sentry / PostHog / Better Stack free projects (minutes).
5. EAS account + `eas init` in `apps/mobile` (needs Expo login).

## Verification evidence

- `pnpm --filter @moments/api run test:events` exercises Sentry + PostHog +
  Better Stack wiring and exits 0 (reports which backends are configured).
- CI workflow `.github/workflows/ci.yml` runs `typecheck`, `lint`, `test`,
  `build` on every push and a stale-client check against the OpenAPI spec.
- `/v1/health` returns `{ status: "ok" }` locally and is the Better Stack
  uptime target for staging/production.
