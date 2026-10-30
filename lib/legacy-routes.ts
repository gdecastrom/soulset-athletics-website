/* The first version of the site used hash routes (/#shop, /#p-sodium). Maps them to the real pages. */
const MAP: Record<string, string> = {
  home: '/', shop: '/shop', 'fuel-planner': '/fuel-planner', manifesto: '/manifesto', help: '/help',
  waitlist: '/waitlist', checkout: '/waitlist', 'waitlist-confirmed': '/waitlist/confirmed', 'order-confirmed': '/waitlist/confirmed',
};

export function oldHashTarget(hash: string): string | null {
  const h = hash.replace(/^#/, '');
  if (MAP[h]) return MAP[h];
  if (h.startsWith('shop-')) return '/shop/' + h.slice(5);
  if (h.startsWith('p-')) return '/products/' + h.slice(2);
  return null;
}
