import { dict } from '../../../lib/dict.ts';
import type { Lang } from '../../../lib/i18n.ts';
import { alternates, type PageProps } from '../../../lib/site.ts';
import { ShopGrid } from './ShopGrid.tsx';

export async function generateMetadata({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  const s = dict(lang).shop;
  return { title: s.eyebrow, description: s.allLead, alternates: alternates(lang, '/shop') };
}

export default async function Shop({ params }: PageProps) {
  return <ShopGrid lang={(await params).lang as Lang} />;
}
