export function makeStore(
  args?: Partial<{ id: string; ownerId: string; name: string; email: string }>,
) {
  return {
    id: args?.id ?? 'store_1',
    ownerId: args?.ownerId ?? 'owner_1',
    name: args?.name ?? 'Test Store',
    email: args?.email ?? 'store@test.dev',
  };
}

export function makeProduct(
  args?: Partial<{ id: string; storeId: string; name: string; price: number }>,
) {
  return {
    id: args?.id ?? 'product_1',
    storeId: args?.storeId ?? 'store_1',
    name: args?.name ?? 'Test Product',
    price: args?.price ?? 9.99,
  };
}
