/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  'mutation AddProduct($name: String!, $price: Float!, $inStock: Boolean!, $storeId: ID!, $description: String, $imageUrl: String) {\n  addProduct(\n    name: $name\n    price: $price\n    inStock: $inStock\n    storeId: $storeId\n    description: $description\n    imageUrl: $imageUrl\n  ) {\n    id\n    name\n    price\n    inStock\n    storeId\n    description\n    imageUrl\n  }\n}': typeof types.AddProductDocument;
  'mutation CheckoutByLink($input: CheckoutByLinkInput!) {\n  checkoutByLink(input: $input) {\n    id\n    total\n    status\n  }\n}': typeof types.CheckoutByLinkDocument;
  'query CheckoutLink($slug: String!) {\n  checkoutLink(slug: $slug) {\n    id\n    slug\n    active\n    createdAt\n    product {\n      id\n      name\n      price\n      inStock\n      description\n      imageUrl\n    }\n    store {\n      id\n      name\n      email\n    }\n  }\n}': typeof types.CheckoutLinkDocument;
  'mutation CreateCheckoutLink($input: CheckoutLinkInput!) {\n  createCheckoutLink(input: $input) {\n    id\n    slug\n    product {\n      id\n      name\n    }\n    store {\n      id\n      name\n    }\n    active\n  }\n}': typeof types.CreateCheckoutLinkDocument;
  'mutation CreateStore($input: StoreInput!) {\n  createStore(input: $input) {\n    id\n    name\n    email\n  }\n}': typeof types.CreateStoreDocument;
  'query StoresOverview {\n  stores {\n    id\n    name\n  }\n}\n\nquery StoreDashboard($storeId: ID!) {\n  products {\n    id\n    name\n    price\n    inStock\n    storeId\n    createdAt\n    quantity\n  }\n  orders(storeId: $storeId) {\n    id\n    total\n    createdAt\n    status\n    quantity\n    product {\n      id\n      name\n    }\n  }\n}': typeof types.StoresOverviewDocument;
  'query OrdersByStore($storeId: ID!) {\n  orders(storeId: $storeId) {\n    id\n    status\n    total\n    quantity\n    shippingNote\n    createdAt\n    customerName\n    email\n    product {\n      id\n      name\n      price\n    }\n    checkoutLink {\n      slug\n    }\n  }\n}': typeof types.OrdersByStoreDocument;
  'query StoreOrders($storeId: ID!) {\n  orders(storeId: $storeId) {\n    id\n    total\n    createdAt\n    status\n    quantity\n    product {\n      id\n      name\n    }\n  }\n}': typeof types.StoreOrdersDocument;
  'query ProductById($id: ID!) {\n  product(id: $id) {\n    id\n    name\n    price\n    inStock\n    storeId\n    description\n    imageUrl\n    quantity\n    store {\n      id\n      name\n      email\n    }\n  }\n}': typeof types.ProductByIdDocument;
  'query Products {\n  products {\n    id\n    name\n    price\n    inStock\n    storeId\n    quantity\n  }\n}': typeof types.ProductsDocument;
  'query Stores {\n  stores {\n    id\n    name\n    email\n  }\n}': typeof types.StoresDocument;
  'mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}': typeof types.UpdateOrderStatusDocument;
  'mutation UpdateProduct($id: ID!, $price: Float!, $inStock: Boolean!, $description: String, $imageUrl: String, $quantity: Int!) {\n  updateProduct(\n    id: $id\n    price: $price\n    inStock: $inStock\n    description: $description\n    imageUrl: $imageUrl\n    quantity: $quantity\n  ) {\n    id\n    name\n    price\n    inStock\n    description\n    imageUrl\n    quantity\n  }\n}': typeof types.UpdateProductDocument;
};
const documents: Documents = {
  'mutation AddProduct($name: String!, $price: Float!, $inStock: Boolean!, $storeId: ID!, $description: String, $imageUrl: String) {\n  addProduct(\n    name: $name\n    price: $price\n    inStock: $inStock\n    storeId: $storeId\n    description: $description\n    imageUrl: $imageUrl\n  ) {\n    id\n    name\n    price\n    inStock\n    storeId\n    description\n    imageUrl\n  }\n}':
    types.AddProductDocument,
  'mutation CheckoutByLink($input: CheckoutByLinkInput!) {\n  checkoutByLink(input: $input) {\n    id\n    total\n    status\n  }\n}':
    types.CheckoutByLinkDocument,
  'query CheckoutLink($slug: String!) {\n  checkoutLink(slug: $slug) {\n    id\n    slug\n    active\n    createdAt\n    product {\n      id\n      name\n      price\n      inStock\n      description\n      imageUrl\n    }\n    store {\n      id\n      name\n      email\n    }\n  }\n}':
    types.CheckoutLinkDocument,
  'mutation CreateCheckoutLink($input: CheckoutLinkInput!) {\n  createCheckoutLink(input: $input) {\n    id\n    slug\n    product {\n      id\n      name\n    }\n    store {\n      id\n      name\n    }\n    active\n  }\n}':
    types.CreateCheckoutLinkDocument,
  'mutation CreateStore($input: StoreInput!) {\n  createStore(input: $input) {\n    id\n    name\n    email\n  }\n}':
    types.CreateStoreDocument,
  'query StoresOverview {\n  stores {\n    id\n    name\n  }\n}\n\nquery StoreDashboard($storeId: ID!) {\n  products {\n    id\n    name\n    price\n    inStock\n    storeId\n    createdAt\n    quantity\n  }\n  orders(storeId: $storeId) {\n    id\n    total\n    createdAt\n    status\n    quantity\n    product {\n      id\n      name\n    }\n  }\n}':
    types.StoresOverviewDocument,
  'query OrdersByStore($storeId: ID!) {\n  orders(storeId: $storeId) {\n    id\n    status\n    total\n    quantity\n    shippingNote\n    createdAt\n    customerName\n    email\n    product {\n      id\n      name\n      price\n    }\n    checkoutLink {\n      slug\n    }\n  }\n}':
    types.OrdersByStoreDocument,
  'query StoreOrders($storeId: ID!) {\n  orders(storeId: $storeId) {\n    id\n    total\n    createdAt\n    status\n    quantity\n    product {\n      id\n      name\n    }\n  }\n}':
    types.StoreOrdersDocument,
  'query ProductById($id: ID!) {\n  product(id: $id) {\n    id\n    name\n    price\n    inStock\n    storeId\n    description\n    imageUrl\n    quantity\n    store {\n      id\n      name\n      email\n    }\n  }\n}':
    types.ProductByIdDocument,
  'query Products {\n  products {\n    id\n    name\n    price\n    inStock\n    storeId\n    quantity\n  }\n}':
    types.ProductsDocument,
  'query Stores {\n  stores {\n    id\n    name\n    email\n  }\n}': types.StoresDocument,
  'mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}':
    types.UpdateOrderStatusDocument,
  'mutation UpdateProduct($id: ID!, $price: Float!, $inStock: Boolean!, $description: String, $imageUrl: String, $quantity: Int!) {\n  updateProduct(\n    id: $id\n    price: $price\n    inStock: $inStock\n    description: $description\n    imageUrl: $imageUrl\n    quantity: $quantity\n  ) {\n    id\n    name\n    price\n    inStock\n    description\n    imageUrl\n    quantity\n  }\n}':
    types.UpdateProductDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'mutation AddProduct($name: String!, $price: Float!, $inStock: Boolean!, $storeId: ID!, $description: String, $imageUrl: String) {\n  addProduct(\n    name: $name\n    price: $price\n    inStock: $inStock\n    storeId: $storeId\n    description: $description\n    imageUrl: $imageUrl\n  ) {\n    id\n    name\n    price\n    inStock\n    storeId\n    description\n    imageUrl\n  }\n}',
): (typeof documents)['mutation AddProduct($name: String!, $price: Float!, $inStock: Boolean!, $storeId: ID!, $description: String, $imageUrl: String) {\n  addProduct(\n    name: $name\n    price: $price\n    inStock: $inStock\n    storeId: $storeId\n    description: $description\n    imageUrl: $imageUrl\n  ) {\n    id\n    name\n    price\n    inStock\n    storeId\n    description\n    imageUrl\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'mutation CheckoutByLink($input: CheckoutByLinkInput!) {\n  checkoutByLink(input: $input) {\n    id\n    total\n    status\n  }\n}',
): (typeof documents)['mutation CheckoutByLink($input: CheckoutByLinkInput!) {\n  checkoutByLink(input: $input) {\n    id\n    total\n    status\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'query CheckoutLink($slug: String!) {\n  checkoutLink(slug: $slug) {\n    id\n    slug\n    active\n    createdAt\n    product {\n      id\n      name\n      price\n      inStock\n      description\n      imageUrl\n    }\n    store {\n      id\n      name\n      email\n    }\n  }\n}',
): (typeof documents)['query CheckoutLink($slug: String!) {\n  checkoutLink(slug: $slug) {\n    id\n    slug\n    active\n    createdAt\n    product {\n      id\n      name\n      price\n      inStock\n      description\n      imageUrl\n    }\n    store {\n      id\n      name\n      email\n    }\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'mutation CreateCheckoutLink($input: CheckoutLinkInput!) {\n  createCheckoutLink(input: $input) {\n    id\n    slug\n    product {\n      id\n      name\n    }\n    store {\n      id\n      name\n    }\n    active\n  }\n}',
): (typeof documents)['mutation CreateCheckoutLink($input: CheckoutLinkInput!) {\n  createCheckoutLink(input: $input) {\n    id\n    slug\n    product {\n      id\n      name\n    }\n    store {\n      id\n      name\n    }\n    active\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'mutation CreateStore($input: StoreInput!) {\n  createStore(input: $input) {\n    id\n    name\n    email\n  }\n}',
): (typeof documents)['mutation CreateStore($input: StoreInput!) {\n  createStore(input: $input) {\n    id\n    name\n    email\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'query StoresOverview {\n  stores {\n    id\n    name\n  }\n}\n\nquery StoreDashboard($storeId: ID!) {\n  products {\n    id\n    name\n    price\n    inStock\n    storeId\n    createdAt\n    quantity\n  }\n  orders(storeId: $storeId) {\n    id\n    total\n    createdAt\n    status\n    quantity\n    product {\n      id\n      name\n    }\n  }\n}',
): (typeof documents)['query StoresOverview {\n  stores {\n    id\n    name\n  }\n}\n\nquery StoreDashboard($storeId: ID!) {\n  products {\n    id\n    name\n    price\n    inStock\n    storeId\n    createdAt\n    quantity\n  }\n  orders(storeId: $storeId) {\n    id\n    total\n    createdAt\n    status\n    quantity\n    product {\n      id\n      name\n    }\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'query OrdersByStore($storeId: ID!) {\n  orders(storeId: $storeId) {\n    id\n    status\n    total\n    quantity\n    shippingNote\n    createdAt\n    customerName\n    email\n    product {\n      id\n      name\n      price\n    }\n    checkoutLink {\n      slug\n    }\n  }\n}',
): (typeof documents)['query OrdersByStore($storeId: ID!) {\n  orders(storeId: $storeId) {\n    id\n    status\n    total\n    quantity\n    shippingNote\n    createdAt\n    customerName\n    email\n    product {\n      id\n      name\n      price\n    }\n    checkoutLink {\n      slug\n    }\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'query StoreOrders($storeId: ID!) {\n  orders(storeId: $storeId) {\n    id\n    total\n    createdAt\n    status\n    quantity\n    product {\n      id\n      name\n    }\n  }\n}',
): (typeof documents)['query StoreOrders($storeId: ID!) {\n  orders(storeId: $storeId) {\n    id\n    total\n    createdAt\n    status\n    quantity\n    product {\n      id\n      name\n    }\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'query ProductById($id: ID!) {\n  product(id: $id) {\n    id\n    name\n    price\n    inStock\n    storeId\n    description\n    imageUrl\n    quantity\n    store {\n      id\n      name\n      email\n    }\n  }\n}',
): (typeof documents)['query ProductById($id: ID!) {\n  product(id: $id) {\n    id\n    name\n    price\n    inStock\n    storeId\n    description\n    imageUrl\n    quantity\n    store {\n      id\n      name\n      email\n    }\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'query Products {\n  products {\n    id\n    name\n    price\n    inStock\n    storeId\n    quantity\n  }\n}',
): (typeof documents)['query Products {\n  products {\n    id\n    name\n    price\n    inStock\n    storeId\n    quantity\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'query Stores {\n  stores {\n    id\n    name\n    email\n  }\n}',
): (typeof documents)['query Stores {\n  stores {\n    id\n    name\n    email\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}',
): (typeof documents)['mutation UpdateOrderStatus($id: ID!, $status: OrderStatus!) {\n  updateOrderStatus(id: $id, status: $status) {\n    id\n    status\n  }\n}'];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: 'mutation UpdateProduct($id: ID!, $price: Float!, $inStock: Boolean!, $description: String, $imageUrl: String, $quantity: Int!) {\n  updateProduct(\n    id: $id\n    price: $price\n    inStock: $inStock\n    description: $description\n    imageUrl: $imageUrl\n    quantity: $quantity\n  ) {\n    id\n    name\n    price\n    inStock\n    description\n    imageUrl\n    quantity\n  }\n}',
): (typeof documents)['mutation UpdateProduct($id: ID!, $price: Float!, $inStock: Boolean!, $description: String, $imageUrl: String, $quantity: Int!) {\n  updateProduct(\n    id: $id\n    price: $price\n    inStock: $inStock\n    description: $description\n    imageUrl: $imageUrl\n    quantity: $quantity\n  ) {\n    id\n    name\n    price\n    inStock\n    description\n    imageUrl\n    quantity\n  }\n}'];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
