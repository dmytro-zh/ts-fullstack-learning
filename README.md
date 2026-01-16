# TS Fullstack Learning

E-commerce study monorepo with a GraphQL API and a Next.js web app.

## Structure

- `apps/api`: Express + Apollo Server + Prisma.
- `apps/web`: Next.js App Router frontend.
- `packages/shared`: shared types, schemas, and role constants.

Docs:

- `ARCHITECTURE.md`
- `CONVENTIONS.md`
- `UI_GUIDELINES.md`

## Requirements

- Node 20 (see `.nvmrc`)
- pnpm

## Setup

1. Install dependencies:
   - `pnpm -w install`
2. Create API env file at `apps/api/.env`:
   - `DATABASE_URL="file:./prisma/dev.db"`
   - `API_JWT_SECRET="dev-secret"`
3. (Optional) Set `API_URL` for the web app if the API runs elsewhere.

## Dev

- API: `pnpm run dev:api` (http://localhost:4000)
- Web: `pnpm run dev:web` (http://localhost:3000)

## Common scripts

- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run format` / `pnpm run format:check`
- `pnpm run build:api`
- `pnpm -C apps/api run test:unit:coverage`
- `pnpm -C apps/api run test:integration:ci`
- `pnpm -F web run build`
- `pnpm run test:pw`

## GraphQL schema

Source of truth is `apps/api/src/server.ts`. Keep `apps/api/schema.graphql` in sync and run
`pnpm -F web graphql:codegen` when the schema changes.
