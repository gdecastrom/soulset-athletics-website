/* Waitlist emails, sent through the Resend HTTP API (https://resend.com/docs/api-reference/emails/send-email).
   Without RESEND_API_KEY, EMAIL_FROM and APP_SECRET (which signs the unsubscribe link) nothing is sent;
   sign-ups are still saved. */

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && process.env.APP_SECRET);

async function send(message, idempotencyKey) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}), ...message }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

const COPY = {
  en: {
    subject: 'You’re on the Soulset waitlist',
    heading: name => `You’re on the list${name ? ', ' + name : ''}.`,
    body: 'We’ll email you the day orders open, with 10% off your first order.',
    picks: 'Your picks',
    note: 'Prices and formulas may still change before launch.',
    unsubscribe: 'Unsubscribe',
  },
  es: {
    subject: 'Ya estás en la lista de Soulset',
    heading: name => `Ya estás en la lista${name ? ', ' + name : ''}.`,
    body: 'Te escribiremos el día que abran los pedidos, con 10% de descuento en tu primer pedido.',
    picks: 'Tus favoritos',
    note: 'Los precios y las fórmulas todavía pueden cambiar antes del lanzamiento.',
    unsubscribe: 'Darte de baja',
  },
};

export function confirmationEmail({ firstName, picks, siteLanguage }, unsubscribeUrl) {
  const t = COPY[siteLanguage] || COPY.en;
  const pickLines = picks.map(p => `${p.qty} × ${p.name}${p.options ? ` (${p.options})` : ''}`);
  const html = `<!doctype html><html lang="${siteLanguage}"><body style="margin:0;background:#0A0A0A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:Arial,Helvetica,sans-serif;color:#F2F0EB">
<tr><td style="font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;padding-bottom:32px">Soulset Athletics <span style="color:#FF5A1F">&gt;</span></td></tr>
<tr><td style="font-size:30px;font-weight:bold;line-height:1.15;text-transform:uppercase;padding-bottom:16px">${esc(t.heading(firstName))}</td></tr>
<tr><td style="font-size:16px;line-height:1.55;color:#D6D3CC;padding-bottom:24px">${esc(t.body)}</td></tr>
${pickLines.length ? `<tr><td style="font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#A3A19B;padding-bottom:8px">${esc(t.picks)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#F2F0EB;padding-bottom:24px">${pickLines.map(esc).join('<br>')}</td></tr>` : ''}
<tr><td style="font-size:13px;line-height:1.5;color:#7D7B76;padding-bottom:32px">${esc(t.note)}</td></tr>
<tr><td style="font-size:12px;line-height:1.5;color:#7D7B76;border-top:1px solid #2A2A28;padding-top:16px">Soulset Athletics · Santo Domingo, RD<br><a href="${esc(unsubscribeUrl)}" style="color:#A3A19B">${esc(t.unsubscribe)}</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [t.heading(firstName), '', t.body, ...(pickLines.length ? ['', t.picks + ':', ...pickLines] : []), '', t.note, '', `${t.unsubscribe}: ${unsubscribeUrl}`].join('\n');
  return { subject: t.subject, html, text };
}

export function sendConfirmation(signup, id, unsubscribeUrl) {
  const { subject, html, text } = confirmationEmail(signup, unsubscribeUrl);
  return send({
    to: [signup.email], subject, html, text,
    headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    tags: [{ name: 'type', value: 'waitlist_confirmation' }],
  }, `waitlist-confirmation/${id}`);
}

/* Optional heads-up to the team for every new sign-up (NOTIFY_EMAIL, comma-separated). */
export function sendTeamNotice(signup) {
  const to = String(process.env.NOTIFY_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!to.length) return Promise.resolve();
  const lines = [
    `Email: ${signup.email}`, `Name: ${signup.firstName || '-'}`, `Province: ${signup.province || '-'}`,
    `Site: ${signup.siteLanguage} · ${signup.source}`,
    `Picks: ${signup.picks.map(p => `${p.qty} × ${p.name} (${p.options})`).join('; ') || '-'}`,
  ];
  return send({ to, subject: `New waitlist sign-up: ${signup.email}`, text: lines.join('\n') });
}
