# Conventions

## Error handling

- Services throw `DomainError` for business rules and validation failures.
- GraphQL resolvers rely on guards (`requireAuth`, `requireMerchantOrOwner`) for auth checks.
- `formatGraphQLError` in the API formats errors for clients; avoid throwing raw `GraphQLError`
  from services.

## Validation

- Validate incoming data at service boundaries with Zod.
- Prefer shared schemas from `packages/shared` where possible.

## Service ↔ Repository boundary

- Default: services access data through repositories.
- Exception: services may use Prisma directly only inside explicit transactions or complex
  multi-entity operations, and must add a short comment explaining why.

## Web GraphQL client

- Server components and server actions use `createWebGraphQLClient`.
- Client components use `createBrowserGraphQLClient`.
- Avoid ad-hoc `fetch` calls to `/api/graphql` in page files.

## Naming and structure

- Services: `*.service.ts`
- Repositories: `*.repository.ts`
- Tests: `*.unit.test.ts`, `*.integration.test.ts`, `*.graphql.test.ts`
- UI primitives: `apps/web/src/components/ui/*`
