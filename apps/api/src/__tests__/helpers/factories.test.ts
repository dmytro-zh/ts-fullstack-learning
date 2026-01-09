import { describe, expect, it } from 'vitest';
import { makeProduct, makeStore } from './factories';

describe('test factories', () => {
  it('creates store defaults', () => {
    const store = makeStore();
    expect(store.id).toBeTruthy();
    expect(store.ownerId).toBeTruthy();
  });

  it('creates product defaults', () => {
    const product = makeProduct();
    expect(product.id).toBeTruthy();
    expect(product.storeId).toBeTruthy();
  });
});
