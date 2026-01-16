import { ApolloServer } from '@apollo/server';
import { requireAuth, requireMerchantOrOwner } from './auth/guards';
import { issueReceiptToken, verifyReceiptToken } from './auth/receipt-token';
import { ProductService } from './services/product.service';
import { StoreService } from './services/store.service';
import { CheckoutLinkService } from './services/checkout-link.service';
import { OrderService } from './services/order.service';
import type { GraphQLContext } from './server-context';
import { formatGraphQLError } from './errors/format-graphql-error';
import { DomainError } from './errors/domain-error';
import { ERROR_CODES } from './errors/codes';
import { prisma } from './lib/prisma';

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
    slug: String!
    name: String!
    price: Float!
    inStock: Boolean!
    storeId: ID
    store: Store
    description: String
    imageUrl: String
    createdAt: String!
    quantity: Int!
    images: [ProductImage!]!
    isActive: Boolean!
  }

  type ProductImage {
    id: ID!
    key: String!
    url: String!
    width: Int
    height: Int
    mime: String!
    size: Int!
    isPrimary: Boolean!
    createdAt: String!
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

  type CheckoutReceipt {
    order: Order!
    receiptToken: String!
  }

  type Query {
    health: String!
    products: [Product!]!
    product(id: ID!): Product
    stores: [Store!]!
    checkoutLink(slug: String!): CheckoutLink
    orders(storeId: ID!): [Order!]!
    order(id: ID!): Order
    orderReceipt(orderId: ID!, token: String!): Order!
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

    deleteProduct(id: ID!): Product!

    createStore(input: StoreInput!): Store!
    createCheckoutLink(input: CheckoutLinkInput!): CheckoutLink!
    checkoutByLink(input: CheckoutByLinkInput!): CheckoutReceipt!
    updateOrderStatus(orderId: ID!, status: OrderStatus!): Order!
  }
`;

const productService = new ProductService();
const storeService = new StoreService();
const checkoutLinkService = new CheckoutLinkService();
const orderService = new OrderService();

function requireGraphqlAuth(ctx: GraphQLContext) {
  // Reuse your guard and return a non-null userId for convenience
  return requireAuth(ctx.auth.userId);
}

const resolvers = {
  Query: {
    health: () => 'OK',

    products: (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return productService.getProducts(ctx);
    },

    product: (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return productService.getProduct(ctx, args.id);
    },

    stores: (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return storeService.getStores(ctx);
    },

    orders: (_: unknown, args: { storeId: string }, ctx: GraphQLContext) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return orderService.getByStore(ctx, args.storeId);
    },

    order: (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return orderService.getById(ctx, args.id);
    },

    orderReceipt: async (_: unknown, args: { orderId: string; token: string }) => {
      const receipt = await verifyReceiptToken(args.token);
      if (!receipt || receipt.orderId !== args.orderId) {
        throw new DomainError(ERROR_CODES.NOT_FOUND, 'Order not found', { field: 'orderId' });
      }

      const order = await orderService.getByIdForReceipt(args.orderId);
      if (!order || order.email !== receipt.email) {
        throw new DomainError(ERROR_CODES.NOT_FOUND, 'Order not found', { field: 'orderId' });
      }

      return order;
    },

    checkoutLink: async (_: unknown, args: { slug: string }) => {
      // Public (checkout)
      const link = await checkoutLinkService.getBySlug(args.slug);

      if (!link || !link.active) {
        throw new DomainError(
          ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
          'Checkout link not found or inactive',
          { field: 'slug' },
        );
      }

      // IMPORTANT: do not allow checkout for deleted products
      // @ts-ignore - depends on include shape
      if ((link as any).product && (link as any).product.isActive === false) {
        throw new DomainError(
          ERROR_CODES.CHECKOUT_LINK_NOT_FOUND_OR_INACTIVE,
          'Checkout link not found or inactive',
          { field: 'slug' },
        );
      }

      return link;
    },
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
      ctx: GraphQLContext,
    ) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return productService.addProduct(ctx, args);
    },

    updateProduct: (
      _: unknown,
      args: {
        id: string;
        price: number;
        description?: string;
        imageUrl?: string;
        quantity?: number;
      },
      ctx: GraphQLContext,
    ) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return productService.updateProduct(ctx, args);
    },

    deleteProduct: (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return productService.deleteProduct(ctx, args.id);
    },

    createStore: (
      _: unknown,
      args: { input: { name: string; email?: string } },
      ctx: GraphQLContext,
    ) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return storeService.createStore(ctx, args.input);
    },

    createCheckoutLink: (
      _: unknown,
      args: { input: { slug: string; productId: string; storeId?: string } },
      ctx: GraphQLContext,
    ) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      return checkoutLinkService.createLink(ctx, args.input);
    },

    checkoutByLink: async (
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
    ) => {
      // Public (checkout)
      const order = await checkoutLinkService.checkoutByLink(args.input);
      const receiptToken = await issueReceiptToken({ orderId: order.id, email: order.email });

      return { order, receiptToken };
    },

    updateOrderStatus: (
      _: unknown,
      args: { orderId: string; status: string },
      ctx: GraphQLContext,
    ) => {
      requireGraphqlAuth(ctx);
      requireMerchantOrOwner(ctx);
      // Optional: you can validate enum value here if you want to harden input
      return orderService.updateStatus(ctx, args.orderId, args.status);
    },
  },

  Product: {
    images: async (parent: { id: string }) => {
      const images = await prisma.productImage.findMany({
        where: { productId: parent.id },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      });

      return images;
    },
  },
};

export function createApolloServer() {
  return new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    formatError: formatGraphQLError,
  });
}
