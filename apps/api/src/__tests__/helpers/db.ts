// NOTE: Use only for integration tests that touch the real DB (Prisma).
// Keep unit tests DB-free.

export async function resetDbForTests() {
  // Placeholder.
  // Later we can:
  // - truncate tables
  // - or recreate sqlite file
  // - or run prisma migrate reset on a separate test db
}

export async function disconnectDbForTests() {
  // Placeholder. Usually prisma.$disconnect()
}
