/* Small helpers shared by the API routes. */

export const json = (status: number, body: unknown) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

/* Browsers send Origin on cross-site POSTs; refuse those. Requests without Origin (curl, server-to-server) pass. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

/* Reads a JSON body up to maxBytes. */
export async function readJson(request: Request, maxBytes = 20_000): Promise<{ body: unknown; error?: undefined } | { body?: undefined; error: Response }> {
  const raw = await request.text();
  if (raw.length > maxBytes) return { error: json(413, { error: 'too_large' }) };
  try { return { body: JSON.parse(raw) }; } catch { return { error: json(400, { error: 'invalid_json' }) }; }
}

export function siteUrl(request: Request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(request.url).origin;
}
