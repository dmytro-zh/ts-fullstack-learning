// Shared domain types for the entire monorepo.
export type Product = {
  id: string;
  name: string;
  price: number;
  // Optional for now; API schema does not include it yet.
  inStock?: boolean;
};
