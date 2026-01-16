# Architecture

## Monorepo layout

- `apps/api`: Express + Apollo Server + Prisma (GraphQL API).
- `apps/web`: Next.js App Router frontend.
- `packages/shared`: shared types, schemas, and role constants.

## Runtime data flow

1. Web UI calls GraphQL.
   - Server components and server actions use `apps/web/src/lib/graphql-client.ts`.
   - Client components use the browser GraphQL client (same file).
2. `/api/graphql` in the web app proxies to the API service and forwards auth.
3. API resolvers call services → repositories → Prisma → database.

## Auth overview

- Web `/api/auth/login` issues an HTTP-only `api_token` cookie.
- Web server components read cookies and attach `Authorization: Bearer <token>` upstream.
- API derives auth from the bearer token in `apps/api/src/auth`.

## GraphQL schema source of truth

- Source of truth: `apps/api/src/server.ts` (`typeDefs`).
- `apps/api/schema.graphql` is a derived artifact for tooling.
- When the schema changes:
  1. Update `apps/api/src/server.ts`.
  2. Update `apps/api/schema.graphql` to match.
  3. Regenerate web types if needed: `pnpm -F web graphql:codegen`.

## Build/runtime boundaries

- `packages/shared` is built with TypeScript and consumed by both apps.
- `apps/api` builds with `tsc` and runs as a Node service.
- `apps/web` builds with Next.js and hosts server routes + UI.
