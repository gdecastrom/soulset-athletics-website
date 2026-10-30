import { WaitlistConfirmed } from '../../../../components/WaitlistForms.tsx';
import { dict } from '../../../../lib/dict.ts';
import type { Lang } from '../../../../lib/i18n.ts';
import type { PageProps } from '../../../../lib/site.ts';

export async function generateMetadata({ params }: PageProps) {
  return { title: dict((await params).lang as Lang).confirmed.title, robots: { index: false } };
}

export default async function Confirmed({ params }: PageProps) {
  return <WaitlistConfirmed lang={(await params).lang as Lang} />;
}
