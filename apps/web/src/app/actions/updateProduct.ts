'use server';

import { GraphQLClient } from 'graphql-request';
import { z } from 'zod';
import { getEnv } from '../../lib/env';
import { UpdateProductDocument } from '../../graphql/generated/graphql';

const schema = z.object({
  id: z.string().min(1),
  price: z.number(),
  inStock: z.boolean(),
  description: z.string().optional(),
  imageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal('')),
  quantity: z.number().int().min(0),
});

type UpdateProductInput = z.infer<typeof schema>;

export async function updateProductAction(input: UpdateProductInput) {
  const data = schema.parse(input);
  const { GRAPHQL_URL } = getEnv();
  const client = new GraphQLClient(GRAPHQL_URL);

  await client.request(UpdateProductDocument, {
    id: data.id,
    price: data.price,
    inStock: data.inStock,
    description: data.description,
    imageUrl: data.imageUrl,
    quantity: data.quantity,
  });
}
