/* Where /api/payment-callback sends the customer after paying. It only shows the status passed in the URL and
   never reads the order from the database, so it can't expose anyone's order details. */
import Link from 'next/link';
import { dict } from '../../../lib/dict.ts';
import { href, type Lang } from '../../../lib/i18n.ts';

type Status = 'paid' | 'declined' | 'cancelled' | 'error';
const STATUSES: Status[] = ['paid', 'declined', 'cancelled', 'error'];

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  return { title: dict((await params).lang as Lang).order.title, robots: { index: false } };
}

export default async function OrderResult({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const lang = (await params).lang as Lang;
  const q = await searchParams;
  const status = STATUSES.find(s => s === q.status) ?? 'error';
  const number = typeof q.number === 'string' && /^SA-\d{6,}$/.test(q.number) ? q.number : '';
  const o = dict(lang).order;
  const [title, text] = o.status[status];
  return (
    <div className="wrap conf">
      <div style={{ display: 'grid', gap: 16 }}>
        {number && <span className="eyebrow">{o.number} {number}</span>}
        <h1 className="d-xl">{title}</h1>
        <p className="lead">{text}</p>
        <p style={{ color: 'var(--muted)' }}>{o.help}</p>
      </div>
      <div><Link className="btn btn-primary btn-l" href={href(lang, '/shop')}>{o.shop}</Link></div>
    </div>
  );
}
