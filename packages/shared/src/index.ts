import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  inStock: z.boolean(),
});

export type Product = z.infer<typeof ProductSchema>;
export * from './auth/roles.js';
