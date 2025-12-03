import { ApolloServer } from '@apollo/server';
import { ProductService } from './services/product.service';
import { StoreService } from './services/store.service';
import { CheckoutLinkService } from './services/checkout-link.service';

const typeDefs = /* GraphQL */ `
  type Product {
    id: ID!
    name: String!
    price: Float!
    inStock: Boolean!
    storeId: ID
    store: Store
  }

  type CheckoutLink {
    id: ID!
    slug: String!
    active: Boolean!
    product: Product!
    store: Store
    createdAt: String!
  }

  input CheckoutInput {
    customerName: String!
    email: String!
  }

  input CheckoutByLinkInput {
    slug: String!
    customerName: String!
    email: String!
    shippingNote: String
    quantity: Int
  }

  input CheckoutLinkInput {
    slug: String!
    productId: ID!
    storeId: ID
  }

  input StoreInput {
    name: String!
    email: String
  }

  type Store {
    id: ID!
    name: String!
    email: String
    products: [Product!]!
    createdAt: String!
    updatedAt: String!
  }

  type Order {
    id: ID!
    customerName: String!
    email: String!
    total: Float!
    status: String!
    checkoutLinkId: ID
    storeId: ID
    productId: ID!
    quantity: Int!
    shippingNote: String
    createdAt: String!
  }

  type Query {
    health: String!
    products: [Product!]!
    product(id: ID!): Product
    stores: [Store!]!
    checkoutLink(slug: String!): CheckoutLink
  }

  type Mutation {
    addProduct(name: String!, price: Float!, inStock: Boolean!, storeId: ID): Product!
    updateProduct(id: ID!, price: Float!, inStock: Boolean!): Product!
    createStore(input: StoreInput!): Store!
    createCheckoutLink(input: CheckoutLinkInput!): CheckoutLink!
    checkoutByLink(input: CheckoutByLinkInput!): Order!
  }
`;

const productService = new ProductService();
const storeService = new StoreService();
const checkoutLinkService = new CheckoutLinkService();

const resolvers = {
  Query: {
    health: () => 'OK',
    products: () => productService.getProducts(),
    product: (_: unknown, args: { id: string }) => productService.getProduct(args.id),
    stores: () => storeService.getStores(),
    checkoutLink: (_: unknown, args: { slug: string }) => checkoutLinkService.getBySlug(args.slug),
  },
  Mutation: {
    addProduct: (
      _: unknown,
      args: { name: string; price: number; inStock: boolean; storeId?: string },
    ) => productService.addProduct(args),
    updateProduct: (_: unknown, args: { id: string; price: number; inStock: boolean }) =>
      productService.updateProduct(args),
    createStore: (_: unknown, args: { input: { name: string; email?: string } }) =>
      storeService.createStore(args.input),
    createCheckoutLink: (
      _: unknown,
      args: { input: { slug: string; productId: string; storeId?: string } },
    ) => checkoutLinkService.createLink(args.input),
    checkoutByLink: (
      _: unknown,
      args: {
        input: {
          slug: string;
          customerName: string;
          email: string;
          shippingNote?: string;
          quantity: number;
        };
      },
    ) => checkoutLinkService.checkoutByLink(args.input),
  },
};

export function createApolloServer() {
  return new ApolloServer({ typeDefs, resolvers });
}
