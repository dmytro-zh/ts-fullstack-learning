import { ApolloServer } from '@apollo/server';
import { ProductService } from './services/product.service';
import { StoreService } from './services/store.service';
import { CheckoutLinkService } from './services/checkout-link.service';
import { OrderService } from './services/order.service';
import { formatGraphQLError } from './errors/format-graphql-error';
import { DomainError } from './errors/domain-error';
import { ERROR_CODES } from './errors/codes';

const typeDefs = /* GraphQL */ `
  enum OrderStatus {
    NEW
    PENDING
    PENDING_PAYMENT
    PAID
    PROCESSING
    SHIPPED
    COMPLETED
    CANCELLED
    REFUNDED
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    inStock: Boolean!
    storeId: ID
    store: Store
    description: String
    imageUrl: String
    createdAt: String!
    quantity: Int!
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
    quantity: Int!
    shippingAddress: String!
    shippingNote: String
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
    ownerId: ID!
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
    status: OrderStatus!
    checkoutLinkId: ID
    checkoutLink: CheckoutLink
    storeId: ID
    store: Store
    productId: ID!
    product: Product!
    quantity: Int!
    shippingNote: String
    shippingAddress: String!
    createdAt: String!
  }

  type Query {
    health: String!
    products: [Product!]!
    product(id: ID!): Product
    stores: [Store!]!
    checkoutLink(slug: String!): CheckoutLink
    orders(storeId: ID!): [Order!]!
    order(id: ID!): Order
  }

  type Mutation {
    addProduct(
      name: String!
      price: Float!
      storeId: ID!
      description: String
      imageUrl: String
      quantity: Int
    ): Product!

    updateProduct(
      id: ID!
      price: Float!
      description: String
      imageUrl: String
      quantity: Int
    ): Product!

    createStore(input: StoreInput!): Store!
    createCheckoutLink(input: CheckoutLinkInput!): CheckoutLink!
    checkoutByLink(input: CheckoutByLinkInput!): Order!
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!
  }
`;

const productService = new ProductService();
const storeService = new StoreService();
const checkoutLinkService = new CheckoutLinkService();
const orderService = new OrderService();

const resolvers = {
  Query: {
    health: () => 'OK',
    products: () => productService.getProducts(),
    product: (_: unknown, args: { id: string }) => productService.getProduct(args.id),
    stores: () => storeService.getStores(),
    checkoutLink: async (_: unknown, args: { slug: string }) => {
      const link = await checkoutLinkService.getBySlug(args.slug);

      if (!link || !link.active) {
        throw new DomainError(
          ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
          'Checkout link not found or inactive',
          { field: 'slug' },
        );
      }

      return link;
    },
    orders: (_: unknown, args: { storeId: string }) => orderService.getByStore(args.storeId),
    order: (_: unknown, args: { id: string }) => orderService.getById(args.id),
  },
  Mutation: {
    addProduct: (
      _: unknown,
      args: {
        name: string;
        price: number;
        storeId: string;
        description?: string;
        imageUrl?: string;
        quantity?: number;
      },
    ) => productService.addProduct(args),

    updateProduct: (
      _: unknown,
      args: {
        id: string;
        price: number;
        description?: string;
        imageUrl?: string;
        quantity?: number;
      },
    ) => productService.updateProduct(args),

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
          quantity: number;
          shippingAddress: string;
          shippingNote?: string;
        };
      },
    ) => checkoutLinkService.checkoutByLink(args.input),

    updateOrderStatus: (_: unknown, args: { orderId: string; status: string }) =>
      orderService.updateStatus(args.orderId, args.status),
  },
};

export function createApolloServer() {
  return new ApolloServer({
    typeDefs,
    resolvers,
    formatError: formatGraphQLError,
  });
}
