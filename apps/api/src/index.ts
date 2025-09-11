// Simple Apollo Server v4 using the standalone helper.
// Strict TS and ESM-ready.

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

const typeDefs = /* GraphQL */ `
  type Product {
    id: ID!
    name: String!
    price: Float!
  }

  type Query {
    health: String!
    products: [Product!]!
  }

  type Mutation {
    addProduct(name: String!, price: Float!): Product!
  }
`;

type Product = { id: string; name: string; price: number };
const db: Product[] = [
  { id: '1', name: 'Coffee', price: 3.5 },
  { id: '2', name: 'Tea',    price: 2.9 }
];

const resolvers = {
  Query: {
    health: () => 'OK',
    products: () => db,
  },
  Mutation: {
    addProduct: (_: unknown, args: { name: string; price: number }) => {
      const item: Product = { id: String(Date.now()), name: args.name, price: args.price };
      db.push(item);
      return item;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, {
  listen: { port: 4000 },
  // allow Next.js dev origin
  context: async () => ({}),
}).then(({ url }) => {
  console.log(`✅ GraphQL ready at ${url}`);
});
