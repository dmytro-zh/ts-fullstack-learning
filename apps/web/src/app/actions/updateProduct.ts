'use server';

import { z } from 'zod';
import { createWebGraphQLClient } from '../../lib/graphql-client';
import { UpdateProductDocument } from '../../graphql/generated/graphql';

const schema = z.object({
  id: z.string().min(1),
  price: z.number(),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  quantity: z.number().int().min(0),
});

type UpdateProductInput = z.infer<typeof schema>;

export async function updateProductAction(input: UpdateProductInput) {
  const data = schema.parse(input);
  const client = await createWebGraphQLClient();

  await client.request(UpdateProductDocument, {
    id: data.id,
    price: data.price,
    description: data.description || null,
    imageUrl: data.imageUrl || null,
    quantity: data.quantity,
  });
}
