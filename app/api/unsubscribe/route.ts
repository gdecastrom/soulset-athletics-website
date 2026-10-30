/* /api/unsubscribe?id=…&t=…: the link in every waitlist email.
   GET shows a confirm button (so link scanners that open emails don't unsubscribe people);
   POST unsubscribes. Mail apps' one-click unsubscribe (RFC 8058) also POSTs here. */
import { db } from '../../../lib/server/db.ts';
import { verifyId } from '../../../lib/server/unsubscribe-token.ts';

const page = (status: number, body: string) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Soulset Athletics</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0A0A0A;color:#F2F0EB;font:16px/1.55 Arial,Helvetica,sans-serif;padding:24px}main{max-width:440px;display:grid;gap:16px}h1{margin:0;font-size:28px;line-height:1.1;text-transform:uppercase}p{margin:0;color:#A3A19B}button{justify-self:start;min-height:48px;padding:12px 24px;border:0;background:#FF5A1F;color:#0A0A0A;font:bold 14px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}a{color:#F2F0EB}</style></head>
<body><main>${body}</main></body></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

const invalid = () => page(400, `<h1>Link not valid</h1><p>This unsubscribe link is incomplete or has expired. Reply to any of our emails and we’ll remove you.</p><p lang="es">Este enlace no es válido. Responde a cualquiera de nuestros correos y te damos de baja.</p>`);

function params(request: Request) {
  const q = new URL(request.url).searchParams;
  return { id: q.get('id') || '', t: q.get('t') || '' };
}

export function GET(request: Request) {
  const { id, t } = params(request);
  if (!verifyId(id, t)) return invalid();
  const action = `?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`;
  return page(200, `<h1>Unsubscribe?</h1><p>You’ll stop getting Soulset launch emails.</p><p lang="es">¿Darte de baja? Dejarás de recibir los correos del lanzamiento de Soulset.</p>
<form method="post" action="${action}"><button type="submit">Unsubscribe · Darme de baja</button></form>`);
}

export async function POST(request: Request) {
  const { id, t } = params(request);
  if (!verifyId(id, t)) return invalid();
  const sql = db();
  if (!sql) return page(503, `<h1>Try again later</h1><p>Inténtalo más tarde.</p>`);
  try {
    await sql`update waitlist_signups set unsubscribed_at = coalesce(unsubscribed_at, now()), updated_at = now() where id = ${id}`;
  } catch (err) {
    console.error('[unsubscribe] database error', (err as Error).message);
    return page(500, `<h1>Try again later</h1><p>Something went wrong on our side. · Algo falló de nuestro lado.</p>`);
  }
  return page(200, `<h1>You’re unsubscribed</h1><p>We won’t email you again. · Ya no te escribiremos más.</p><p><a href="/">Soulset Athletics</a></p>`);
}
