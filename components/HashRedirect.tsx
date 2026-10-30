'use client';
/* Links to the old hash routes (/#shop, /#p-sodium) still work: this sends them to the real page. */
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { href, type Lang } from '../lib/i18n.ts';
import { oldHashTarget } from '../lib/legacy-routes.ts';

export function HashRedirect({ lang }: { lang: Lang }) {
  const router = useRouter();
  useEffect(() => {
    if (location.pathname !== href(lang, '/')) return;
    const to = oldHashTarget(location.hash);
    if (to) router.replace(href(lang, to));
  }, [lang, router]);
  return null;
}
