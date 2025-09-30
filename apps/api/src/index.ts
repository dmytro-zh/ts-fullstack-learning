// Simple Apollo Server v4 using the standalone helper.
// Strict TS and ESM-ready.
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PrismaClient } from '@prisma/client';

const typeDefs = /* GraphQL */ `
  type Product {
    id: ID!
    name: String!
    price: Float!
    inStock: Boolean!
  }

  type Query {
    health: String!
    products: [Product!]!
  }

  type Mutation {
    addProduct(name: String!, price: Float!, inStock: Boolean!): Product!
  }
`;

const prisma = new PrismaClient();

const resolvers = {
  Query: {
    health: () => 'OK',
    products: () => prisma.product.findMany(),
  },
  Mutation: {
    addProduct: async (
      _: unknown,
      args: { name: string; price: number; inStock: boolean },
    ) =>
      prisma.product.create({
        data: {
          name: args.name,
          price: args.price,
          inStock: args.inStock,
        },
      }),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async () => ({}),
}).then(({ url }) => {
  console.log(`GraphQL ready at ${url}`);
});
