/* Small helpers shared by the api/ functions. */

export const json = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/* Browsers send Origin on cross-site POSTs; refuse those. Requests without Origin (curl, server-to-server) pass. */
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return !origin || new URL(origin).host === new URL(request.url).host;
}

/* Reads a JSON body up to maxBytes. Returns { body } or { error: Response }. */
export async function readJson(request, maxBytes = 20_000) {
  const raw = await request.text();
  if (raw.length > maxBytes) return { error: json(413, { error: 'too_large' }) };
  try { return { body: JSON.parse(raw) }; } catch { return { error: json(400, { error: 'invalid_json' }) }; }
}

export function siteUrl(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(request.url).origin;
}
