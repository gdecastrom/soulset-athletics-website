import { WaitlistForm } from '../../../components/WaitlistForms.tsx';
import { dict } from '../../../lib/dict.ts';
import type { Lang } from '../../../lib/i18n.ts';
import { alternates, type PageProps } from '../../../lib/site.ts';

export async function generateMetadata({ params }: PageProps) {
  const lang = (await params).lang as Lang;
  const w = dict(lang).waitlist;
  return { title: w.title, description: w.lead, alternates: alternates(lang, '/waitlist') };
}

export default async function Waitlist({ params }: PageProps) {
  return <div className="wrap"><div className="co wl"><WaitlistForm lang={(await params).lang as Lang} /></div></div>;
}
