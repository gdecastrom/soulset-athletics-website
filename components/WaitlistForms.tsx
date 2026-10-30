'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { lineSummary } from '../lib/cart.ts';
import { getProduct, imgSrc, mainImg } from '../lib/catalog.ts';
import { dict } from '../lib/dict.ts';
import { href, money2, type Lang } from '../lib/i18n.ts';
import { PROVINCES } from '../lib/provinces.ts';
import { EMAIL_RE, joinWaitlist, savedSignup, WaitlistError, type SavedSignup } from '../lib/waitlist-client.ts';
import { linePrice, useCart } from './CartProvider.tsx';

const saveError = (lang: Lang, err: unknown) => (err instanceof WaitlistError && err.status === 429 ? dict(lang).errors.rateLimited : dict(lang).errors.save);

/* Sign-up box at the bottom of the home page. */
export function NewsForm({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const { lines } = useCart();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; color: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!EMAIL_RE.test(v)) return setMsg({ text: t.errors.email, color: 'var(--danger)' });
    setBusy(true); setMsg({ text: t.news.saving, color: 'var(--muted)' });
    try {
      await joinWaitlist(lang, lines, { email: v, source: 'home' });
      setMsg({ text: t.news.done, color: 'var(--success)' }); setEmail('');
    } catch (err) { setMsg({ text: saveError(lang, err), color: 'var(--danger)' }); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <form id="newsForm" noValidate onSubmit={submit}>
        <label className="sr" htmlFor="newsEmail">{t.news.label}</label>
        <input id="newsEmail" type="email" placeholder={t.news.placeholder} autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <button className="btn btn-primary" type="submit" disabled={busy}>{t.news.button}</button>
      </form>
      <p className="news-msg" role="status" style={msg ? { color: msg.color } : undefined}>{msg?.text}</p>
    </div>
  );
}

/* The cart lines kept with the sign-up, shown next to the form and on the confirmation page. */
export function PicksSummary({ lang }: { lang: Lang }) {
  const t = dict(lang).waitlist;
  const { lines, count, subtotal } = useCart();
  if (!lines.length) return (
    <>
      <span className="eyebrow">{t.picks}</span>
      <p style={{ color: 'var(--muted)', margin: 0 }}>{t.noPicks}</p>
      <div><Link className="btn btn-secondary" href={href(lang, '/shop')}>{t.browse}</Link></div>
    </>
  );
  return (
    <>
      <span className="eyebrow">{t.picksCount(count)}</span>
      <div style={{ display: 'grid', gap: 14 }}>
        {lines.map(l => {
          const p = getProduct(l.id)!;
          return (
            <div className="sum-item" key={`${l.id}-${JSON.stringify(l.opts)}-${l.sub}`}>
              <div className="th"><Image src={imgSrc(mainImg(p, l.opts))} alt="" width={900} height={900} sizes="64px" /><em>{l.qty}</em></div>
              <div><b>{p.name}</b><small>{lineSummary(l, lang)}</small></div>
              <span className="mono">{money2(linePrice(l) * l.qty)}</span>
            </div>
          );
        })}
      </div>
      <div className="sum-total">
        <span>{t.atLaunch}</span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}><span className="mono" style={{ color: 'var(--muted)', fontSize: 13 }}>USD</span><b>{money2(subtotal)}</b></span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{t.estimate}</p>
    </>
  );
}

/* The waitlist page form. */
export function WaitlistForm({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const w = t.waitlist;
  const router = useRouter();
  const { lines } = useCart();
  const [saved, setSaved] = useState<SavedSignup | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [province, setProvince] = useState('');
  const [company, setCompany] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = savedSignup();
    if (s) { setSaved(s); setEmail(s.email); setFirstName(s.firstName); setProvince(s.province); }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v = email.trim();
    if (!EMAIL_RE.test(v)) { setEmailErr(t.errors.email); document.getElementById('wlEmail')?.focus(); return; }
    const done = href(lang, '/waitlist/confirmed');
    if (company) { router.push(done); return; } /* honeypot: bots fill hidden fields */
    setBusy(true);
    try {
      await joinWaitlist(lang, lines, { email: v, firstName: firstName.trim(), province, source: 'waitlist-page' });
      router.push(done);
    } catch (err) { setFormErr(saveError(lang, err)); setBusy(false); }
  }

  return (
    <>
      <form className="co-main" noValidate onSubmit={submit} onInput={() => setFormErr('')}>
        <div style={{ display: 'grid', gap: 16 }}>
          <span className="eyebrow">{w.eyebrow}</span><h1 className="d-xl">{w.h1}</h1>
          <p className="lead" style={{ margin: 0 }}>{w.lead}</p>
        </div>
        {saved && <div className="testmode" role="note"><b>{w.already}</b>{w.alreadyAs(saved.email)}</div>}
        <fieldset className="fs">
          <legend className="sr">{w.details}</legend>
          <div className="f">
            <label htmlFor="wlEmail">{w.email}</label>
            <input className="input" id="wlEmail" name="email" type="email" autoComplete="email" required placeholder={t.news.placeholder}
              aria-invalid={emailErr ? true : undefined} value={email} onChange={e => { setEmail(e.target.value); setEmailErr(''); }} />
            <span className="err">{emailErr}</span>
          </div>
          <div className="row2">
            <div className="f">
              <label htmlFor="wlFirst">{w.firstName}</label>
              <input className="input" id="wlFirst" name="firstName" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="f">
              <label htmlFor="wlProvince">{w.province}</label>
              <select className="select" id="wlProvince" name="province" autoComplete="address-level1" value={province} onChange={e => setProvince(e.target.value)}>
                <option value="">{w.chooseProvince}</option>
                {PROVINCES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="hp" aria-hidden><label htmlFor="wlCompany">{w.company}</label><input id="wlCompany" name="company" tabIndex={-1} autoComplete="off" value={company} onChange={e => setCompany(e.target.value)} /></div>
        </fieldset>
        <div style={{ display: 'grid', gap: 10 }}>
          <button className="btn btn-primary btn-l btn-block" type="submit" id="wlBtn" disabled={busy}>{w.submit} <span className="edge">›</span></button>
          <span className="err" role="alert">{formErr}</span>
          <p style={{ fontSize: 13, color: 'var(--dim)', margin: 0 }}>{w.privacy}</p>
        </div>
      </form>
      <aside className="co-side" aria-label={w.picks}><PicksSummary lang={lang} /></aside>
      <div className={'processing' + (busy ? ' on' : '')} role="status" aria-live="polite">
        <div><div className="spin"><svg className="chev-svg" viewBox="0 -4 96 108" aria-hidden><path fill="currentColor" d="M0 30 L48 -4 L96 30 L96 44 L48 10 L0 44 Z M0 58 L48 24 L96 58 L96 72 L48 38 L0 72 Z M0 86 L48 52 L96 86 L96 100 L48 66 L0 100 Z" /></svg></div>
          <span className="d-s">{w.saving}</span><span style={{ color: 'var(--muted)' }}>{w.oneSecond}</span></div>
      </div>
    </>
  );
}

/* Thank-you page. Without a saved sign-up in this browser, sends people to the form instead. */
export function WaitlistConfirmed({ lang }: { lang: Lang }) {
  const c = dict(lang).confirmed;
  const router = useRouter();
  const [s, setS] = useState<SavedSignup | null | undefined>(undefined);
  useEffect(() => {
    const saved = savedSignup();
    if (!saved) router.replace(href(lang, '/waitlist')); else setS(saved);
  }, [lang, router]);
  if (!s) return <div className="wrap conf" style={{ minHeight: '60vh' }} />;
  return (
    <div className="wrap conf">
      <div style={{ display: 'grid', gap: 16 }}>
        <span className="eyebrow">{c.eyebrow}</span><h1 className="d-xxl">{c.h1(s.firstName)}</h1>
        <p className="lead">{c.lead[0]}<b style={{ color: 'var(--bone)' }}>{s.email}</b>{c.lead[1]}</p>
      </div>
      <div className="conf-grid">
        <div className="conf-box"><PicksSummary lang={lang} /></div>
        <div className="conf-box" style={{ background: 'var(--raised)' }}>
          <h3>{c.whileTitle}</h3><p>{c.whileText}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn btn-primary" href={href(lang, '/fuel-planner')}>{c.planner}</Link>
            <Link className="btn btn-secondary" href={href(lang, '/manifesto')}>{c.manifesto}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
