'use client';
import { defaults, getProduct } from '../lib/catalog.ts';
import { useCart } from './CartProvider.tsx';

/* "Add +" on product cards: adds the default options and opens the cart. */
export function AddButton({ id, label, text }: { id: string; label: string; text: string }) {
  const { add } = useCart();
  return (
    <button className="btn btn-secondary" style={{ minHeight: 40, padding: '8px 14px', fontSize: 12 }} aria-label={label}
      onClick={() => add(id, defaults(getProduct(id)!), 1, false, true)}>
      {text} <span aria-hidden>+</span>
    </button>
  );
}
