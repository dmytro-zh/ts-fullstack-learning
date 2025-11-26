/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type CartItem = {
  __typename?: 'CartItem';
  createdAt: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  product: Product;
  quantity: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addCartItem: CartItem;
  addProduct: Product;
  removeCartItem: Scalars['Boolean']['output'];
};

export type MutationAddCartItemArgs = {
  productId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
};

export type MutationAddProductArgs = {
  inStock: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
};

export type MutationRemoveCartItemArgs = {
  id: Scalars['ID']['input'];
};

export type Product = {
  __typename?: 'Product';
  id: Scalars['ID']['output'];
  inStock: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  price: Scalars['Float']['output'];
};

export type Query = {
  __typename?: 'Query';
  cartItems: Array<CartItem>;
  health: Scalars['String']['output'];
  products: Array<Product>;
};

export type AddCartItemMutationVariables = Exact<{
  productId: Scalars['ID']['input'];
  quantity: Scalars['Int']['input'];
}>;

export type AddCartItemMutation = {
  __typename?: 'Mutation';
  addCartItem: {
    __typename?: 'CartItem';
    id: string;
    quantity: number;
    product: { __typename?: 'Product'; id: string; name: string; price: number; inStock: boolean };
  };
};

export type AddProductMutationVariables = Exact<{
  name: Scalars['String']['input'];
  price: Scalars['Float']['input'];
  inStock: Scalars['Boolean']['input'];
}>;

export type AddProductMutation = {
  __typename?: 'Mutation';
  addProduct: { __typename?: 'Product'; id: string; name: string; price: number; inStock: boolean };
};

export type CartItemsQueryVariables = Exact<{ [key: string]: never }>;

export type CartItemsQuery = {
  __typename?: 'Query';
  cartItems: Array<{
    __typename?: 'CartItem';
    id: string;
    quantity: number;
    product: { __typename?: 'Product'; id: string; name: string; price: number; inStock: boolean };
  }>;
};

export type ProductsQueryVariables = Exact<{ [key: string]: never }>;

export type ProductsQuery = {
  __typename?: 'Query';
  products: Array<{
    __typename?: 'Product';
    id: string;
    name: string;
    price: number;
    inStock: boolean;
  }>;
};

export type RemoveCartItemMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type RemoveCartItemMutation = { __typename?: 'Mutation'; removeCartItem: boolean };

export const AddCartItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddCartItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'productId' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'quantity' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addCartItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'productId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'productId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'quantity' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'quantity' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'product' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'price' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'inStock' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddCartItemMutation, AddCartItemMutationVariables>;
export const AddProductDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'AddProduct' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'price' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'inStock' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addProduct' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'price' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'price' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'inStock' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'inStock' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'price' } },
                { kind: 'Field', name: { kind: 'Name', value: 'inStock' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddProductMutation, AddProductMutationVariables>;
export const CartItemsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'CartItems' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'cartItems' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'quantity' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'product' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'price' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'inStock' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CartItemsQuery, CartItemsQueryVariables>;
export const ProductsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Products' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'products' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'price' } },
                { kind: 'Field', name: { kind: 'Name', value: 'inStock' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<ProductsQuery, ProductsQueryVariables>;
export const RemoveCartItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'RemoveCartItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'ID' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'removeCartItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<RemoveCartItemMutation, RemoveCartItemMutationVariables>;
