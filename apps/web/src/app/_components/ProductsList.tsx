import type { Product } from '@ts-fullstack-learning/shared';

type ProductDTO = Pick<Product, 'id' | 'name' | 'price'>;
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ProductsList({ products }: { products: ProductDTO[] }) {
  if (products.length === 0) return <p>No products yet.</p>;
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          {p.name} - {usd.format(p.price)}
        </li>
      ))}
    </ul>
  );
}
