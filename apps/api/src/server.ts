import { ApolloServer } from '@apollo/server';
import { ProductService } from './services/product.service';
import { CartService } from './services/cart.service';
import { CheckoutService } from './services/checkout.service';

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

  input CheckoutInput {
    customerName: String!
    email: String!
  }

  type OrderItem {
    id: ID!
    productId: ID!
    quantity: Int!
    priceAtPurchase: Float!
    createdAt: String!
  }

  type Order {
    id: ID!
    customerName: String!
    email: String!
    total: Float!
    items: [OrderItem!]!
    createdAt: String!
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
    checkout(input: CheckoutInput!): Order!
  }
`;

const productService = new ProductService();
const cartService = new CartService();
const checkoutService = new CheckoutService();


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
    checkout: (_: unknown, args: { input: { customerName: string; email: string } }) =>
      checkoutService.checkout(args.input),
    removeCartItem: (_: unknown, args: { id: string }) => cartService.removeCartItem(args.id),
  },
};

export function createApolloServer() {
  return new ApolloServer({ typeDefs, resolvers });
}
