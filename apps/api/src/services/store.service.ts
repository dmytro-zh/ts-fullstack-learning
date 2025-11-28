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
    const data = storeInput.parse(input);
    return this.repo.create(data);
  }

  getStores() {
    return this.repo.findAll();
  }

  getStore(id: string) {
    return this.repo.findById(id);
  }
}
