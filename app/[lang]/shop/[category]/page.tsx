import { notFound } from 'next/navigation';
import { CATEGORIES, CATS, type Category } from '../../../../lib/catalog.ts';
import { tr, type Lang } from '../../../../lib/i18n.ts';
import { alternates, type PageProps } from '../../../../lib/site.ts';
import { ShopGrid } from '../ShopGrid.tsx';

type Props = PageProps<{ category: string }>;
const isCategory = (c: string): c is Category => (CATEGORIES as string[]).includes(c);

export const dynamicParams = false;
export function generateStaticParams() { return CATEGORIES.map(category => ({ category })); }

export async function generateMetadata({ params }: Props) {
  const { lang, category } = await params;
  if (!isCategory(category)) return {};
  return { title: tr(lang as Lang, CATS[category].name), description: tr(lang as Lang, CATS[category].line), alternates: alternates(lang as Lang, `/shop/${category}`) };
}

export default async function ShopCategory({ params }: Props) {
  const { lang, category } = await params;
  if (!isCategory(category)) notFound();
  return <ShopGrid lang={lang as Lang} cat={category} />;
}
