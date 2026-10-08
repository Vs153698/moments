# Moments — Spec Export

> **Provenance:** exported from the Jira board ([momentss.atlassian.net](https://momentss.atlassian.net), project KAN) during F1 (KAN-93). The canonical source spec (sections 6–9, 17, 19) should be reconciled into this file as those sections are implemented. Epic keys: KAN-4 … KAN-22.

## 1. Product summary

Moments lets people create, join and relive shared moments — group experiences with media, chat, routes and live location, wrapped in a privacy-first design.

## 2. Delivery phases & epics

| Phase | Epic | Ticket | Title |
|---|---|---|---|
| 0 | E01 | KAN-4 | Foundation & DevOps |
| 0 | E02 | KAN-5 | Design System & App Shell |
| 1 | E03 | KAN-6 | Auth & Onboarding |
| 1 | E04 | KAN-7 | Moments Core (Create, Join, Lifecycle) |
| 1 | E05 | KAN-8 | Media Pipeline |
| 1 | E06 | KAN-9 | Moment Detail, Timeline & Realtime |
| 1 | E07 | KAN-10 | Chat & Messages |
| 1 | E08 | KAN-11 | Route & Live Location |
| 1 | E09 | KAN-12 | People, Profile & Settings |
| 1 | E10 | KAN-13 | Feed, Explore & Nearby Map |
| 1 | E11 | KAN-14 | Ended Moment & Export |
| 1 | E12 | KAN-15 | Notifications |
| 1 | E13 | KAN-16 | Safety, Moderation & Compliance |
| 1 | E14 | KAN-17 | Web, Deep Links & Analytics |
| 2 | E15 | KAN-18 | Launch Readiness (MVP Release) |
| 3 | E16 | KAN-19 | AI Memory |
| 3 | E17 | KAN-20 | Creator Reputation & Badges |
| 3 | E18 | KAN-21 | Payments & Creator Monetization |
| 3 | E19 | KAN-22 | Brands, Commerce & Moment+ |

## 3. Phase 0 detail (E01, KAN-4)

Stories: F1 (KAN-23) monorepo & CI · F4 (KAN-24) database schema & seed · F5 (KAN-25) NestJS API skeleton · F6 (KAN-26) OpenAPI client generation · F8 (KAN-27) environments & third-party accounts.

**Epic done when:**

- `pnpm typecheck && pnpm lint && pnpm test` pass in CI on every PR
- `pnpm db:migrate && pnpm db:seed` works on a fresh machine
- `/v1/health` is green on staging and the OpenAPI doc is served
- Staging build installs from TestFlight / Play internal track
- Sentry and PostHog receive a test event from mobile, web and API
- AGENTS.md / CLAUDE.md committed (spec section 19)

## 4. Notable engineering constraints (reconstructed)

- **Section 6 — data model:** `Moment.privacy ∈ {public, invite_only, private}`; approximate (H3) location stored for moments, exact location only while live-sharing (see E08, KAN-11).
- **Section 7 — monorepo:** Turborepo + pnpm, `apps/*` + `packages/*`, shared config in `packages/config`.
- **Sections 8/9 — API & environments:** NestJS API under `/v1`, OpenAPI-first, staging + preview environments, generated API client consumed via TanStack Query.
- **Section 17 — environments/accounts:** third-party accounts (Sentry, PostHog, Stream, Mapbox, Cloudflare R2/Stream, Expo EAS, Apple/Google developer programs) provisioned per environment with secrets in a manager, never in the repo.
- **Section 19 — agent instructions:** AGENTS.md / CLAUDE.md at repo root (see those files).

## 5. Out of scope for Phase 0

Anything in E02–E19. Phase 0 exists so every later epic can be built and shipped without setup work.
