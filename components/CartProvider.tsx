'use client';
/* Cart state for the whole site, kept in localStorage. Pre-launch the cart is a wishlist that goes with the waitlist sign-up. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getProduct, subPrice, unitPrice, type CartLine, type Opts } from '../lib/catalog.ts';
import { dict } from '../lib/dict.ts';
import type { Lang } from '../lib/i18n.ts';

const KEY = 'ss_cart';

type CartApi = {
  lang: Lang;
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (id: string, opts: Opts, qty?: number, sub?: boolean, openDrawer?: boolean) => void;
  setQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  toast: (msg: string) => void;
};

const CartContext = createContext<CartApi | null>(null);

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart must be used inside <CartProvider>');
  return c;
}

export const linePrice = (l: CartLine) => {
  const u = unitPrice(getProduct(l.id)!, l.opts) ?? 0;
  return l.sub ? subPrice(u) : u;
};
const sameLine = (a: CartLine, b: CartLine) => a.id === b.id && a.sub === b.sub && JSON.stringify(a.opts) === JSON.stringify(b.opts);

/* Drops anything stored by an older version of the site or edited by hand. */
function clean(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(l => {
    const p = l && typeof l.id === 'string' ? getProduct(l.id) : undefined;
    if (!p || !l.opts || typeof l.opts !== 'object' || unitPrice(p, l.opts) == null) return [];
    const opts = Object.fromEntries(p.options.map(op => [op.key, String(l.opts[op.key])]));
    return [{ id: p.id, opts, qty: Math.max(1, Math.min(99, parseInt(l.qty, 10) || 1)), sub: l.sub === true && p.sub }];
  });
}

export function CartProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    try { setLines(clean(JSON.parse(localStorage.getItem(KEY) || '[]'))); } catch { /* storage blocked: start empty */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* private mode: keep in memory */ }
  }, [lines, loaded]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

  const add = useCallback((id: string, opts: Opts, qty = 1, sub = false, openDrawer = true) => {
    const line: CartLine = { id, opts: { ...opts }, qty, sub };
    setLines(prev => {
      const i = prev.findIndex(l => sameLine(l, line));
      if (i < 0) return [...prev, line];
      return prev.map((l, j) => (j === i ? { ...l, qty: Math.min(99, l.qty + qty) } : l));
    });
    if (openDrawer) setOpen(true); else toast(dict(lang).cart.added(getProduct(id)!.name));
  }, [lang, toast]);

  const api = useMemo<CartApi>(() => ({
    lang, lines, isOpen,
    count: lines.reduce((a, l) => a + l.qty, 0),
    subtotal: lines.reduce((a, l) => a + linePrice(l) * l.qty, 0),
    open: () => setOpen(true),
    close: () => setOpen(false),
    add,
    setQty: (index, qty) => setLines(prev => (qty < 1 ? prev.filter((_, j) => j !== index) : prev.map((l, j) => (j === index ? { ...l, qty: Math.min(99, qty) } : l)))),
    remove: index => setLines(prev => prev.filter((_, j) => j !== index)),
    toast,
  }), [lang, lines, isOpen, add, toast]);

  return (
    <CartContext.Provider value={api}>
      {children}
      <div className={'toast' + (toastMsg ? ' on' : '')} role="status" aria-live="polite">{toastMsg}</div>
    </CartContext.Provider>
  );
}
