import { z } from 'zod';
import { StoreRepository } from '../repositories/store.repository';

const storeInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
});
type StoreInput = z.infer<typeof storeInput>;

export class StoreService {
  constructor(private readonly repo = new StoreRepository()) {}

  createStore(input: StoreInput) {
  const parsed = storeInput.parse(input);
  const data = { ...parsed, email: parsed.email ?? null }; // email: string | null
  return this.repo.create(data);
}

  getStores() {
    return this.repo.findAll();
  }

  getStore(id: string) {
    return this.repo.findById(id);
  }
}
