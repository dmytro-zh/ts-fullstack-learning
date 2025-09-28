import type { Product } from '@ts-fullstack-learning/shared';
export type { Product } from '@ts-fullstack-learning/shared';

interface ProductsData {
  products: Product[];
}

const defaultProductsData: ProductsData = {
  products: [
    { id: '1', name: 'Coffee', price: 3.5, inStock: true },
    { id: '2', name: 'Tea', price: 2.9, inStock: false },
    { id: '3', name: 'Milk', price: 1.8, inStock: true },
    { id: '4', name: 'Bread', price: 2.2, inStock: true },
    { id: '5', name: 'Chocolate', price: 4.5, inStock: false },
    { id: '6', name: 'Juice', price: 3.1, inStock: true },
    { id: '7', name: 'Water', price: 1.0, inStock: true },
    { id: '8', name: 'Cheese', price: 5.7, inStock: false },
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
