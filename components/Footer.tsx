import Link from 'next/link';
import { dict } from '../lib/dict.ts';
import { href, type Lang } from '../lib/i18n.ts';
import { LogoStack } from './Logos.tsx';

export function Footer({ lang }: { lang: Lang }) {
  const f = dict(lang).footer;
  const l = (path: string) => href(lang, path);
  return (
    <footer className="wrap foot">
      <div className="foot-top">
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div><LogoStack label="Soulset Athletics" /></div>
          <p style={{ color: 'var(--muted)', maxWidth: '36ch' }}>{f.tagline}</p>
        </div>
        <div>
          <h4>{f.shop}</h4>
          <ul>
            {(['fuel', 'hydrate', 'build', 'ignite', 'stacks'] as const).map(c => <li key={c}><Link href={l(`/shop/${c}`)}>{f.shopLinks[c]}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4>{f.brand}</h4>
          <ul>
            <li><Link href={l('/manifesto')}>{f.manifesto}</Link></li>
            <li><Link href={l('/fuel-planner')}>{f.planner}</Link></li>
            <li><Link href={l('/waitlist')}>{f.waitlist}</Link></li>
            <li><Link href={l('/help')}>{f.shipping}</Link></li>
            <li><Link href={l('/help')}>{f.faq}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{f.contact}</h4>
          <ul>
            <li><a href="mailto:hola@soulsetathletics.com">hola@soulsetathletics.com</a></li>
            <li><span style={{ color: '#D6D3CC' }}>{f.city}</span></li>
            <li><a href="https://wa.me/18296372972" target="_blank" rel="noopener" aria-label={f.whatsapp}>WhatsApp +1 829-637-2972</a></li>
            <li><a href="https://www.instagram.com/soulsetathletics/" target="_blank" rel="noopener">Instagram @soulsetathletics</a></li>
          </ul>
        </div>
      </div>
      <div className="foot-bottom">
        <span>© 2026 Soulset Athletics</span>
        <span>{f.prelaunch}</span>
      </div>
    </footer>
  );
}
