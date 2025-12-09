import { z } from 'zod';
import { StoreRepository } from '../repositories/store.repository';
import { getCurrentOwnerId } from '../lib/current-owner';

const storeInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
});
type StoreInput = z.infer<typeof storeInput>;

export class StoreService {
  constructor(private readonly repo = new StoreRepository()) {}

  createStore(input: StoreInput) {
    const parsed = storeInput.parse(input);
    const ownerId = getCurrentOwnerId();

    return this.repo.create({
      name: parsed.name,
      email: parsed.email ?? null,
      ownerId,
    });
  }

  getStores() {
    const ownerId = getCurrentOwnerId();
    return this.repo.findAllByOwner(ownerId);
  }

  getStore(id: string) {
    const ownerId = getCurrentOwnerId();
    return this.repo.findByIdForOwner(id, ownerId);
  }
}
