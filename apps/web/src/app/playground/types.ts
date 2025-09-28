import type { Product } from '@ts-fullstack-learning/shared';
export type { Product } from '@ts-fullstack-learning/shared';

interface ProductsData {
  products: Product[];
}

const defaultProductsData: ProductsData = {
  products: [
    { id: '1', name: 'Coffee', price: 3.5, inStock: true },
    { id: '2', name: 'Tea', price: 2.9, inStock: false },
  ],
};

function printProduct(product: Product): string {
  return `${product.name} - $${product.price.toFixed(2)} (${product.inStock ? 'in stock' : 'out of stock'})`;
}

// Checking the module works as expected.
const first = defaultProductsData.products[0];
if (first) {
  console.log(printProduct(first));
}

export { defaultProductsData };
