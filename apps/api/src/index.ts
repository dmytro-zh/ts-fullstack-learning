// Simple Apollo Server v4 using the standalone helper.
// Strict TS and ESM-ready.
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ProductService } from './services/product.service';
import { CartService } from './services/cart.service';

const typeDefs = /* GraphQL */ `
  type Product {
    id: ID!
    name: String!
    price: Float!
    inStock: Boolean!
  }

  type CartItem {
    id: ID!
    quantity: Int!
    createdAt: String!
    product: Product!
  }

  type Query {
    health: String!
    products: [Product!]!
    cartItems: [CartItem!]!
  }

  type Mutation {
    addProduct(name: String!, price: Float!, inStock: Boolean!): Product!
    addCartItem(productId: ID!, quantity: Int!): CartItem!
    removeCartItem(id: ID!): Boolean!
  }
`;

const productService = new ProductService();
const cartService = new CartService();

const resolvers = {
  Query: {
    health: () => 'OK',
    products: () => productService.getProducts(),
    cartItems: () => cartService.getCartItems(),
  },
  Mutation: {
    addProduct: (_: unknown, args: { name: string; price: number; inStock: boolean }) =>
      productService.addProduct(args),
    addCartItem: (_: unknown, args: { productId: string; quantity: number }) =>
      cartService.addCartItem(args),
    removeCartItem: (_: unknown, args: { id: string }) =>
      cartService.removeCartItem(args.id),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async () => ({}),
}).then(({ url }) => {
  console.log(`GraphQL ready at ${url}`);
});
