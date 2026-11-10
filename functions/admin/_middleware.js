import { getSession } from '../_lib/auth.js';

// Everything under /admin needs a signed-in admin, except the login page and its assets.
const PUBLIC = [/^\/admin\/login(\/|\/index\.html)?$/, /^\/admin\/admin\.(css|js)$/];

export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  if (PUBLIC.some((re) => re.test(path))) {
    const res = await context.next();
    return withHeaders(res);
  }
  const session = await getSession(context);
  if (!session) {
    return new Response(null, { status: 302, headers: { Location: '/admin/login/', 'Cache-Control': 'no-store' } });
  }
  context.data.session = session;
  return withHeaders(await context.next());
}

function withHeaders(res) {
  const r = new Response(res.body, res);
  r.headers.set('Cache-Control', 'no-store');
  r.headers.set('X-Robots-Tag', 'noindex, nofollow');
  r.headers.set('X-Frame-Options', 'DENY');
  r.headers.set('Referrer-Policy', 'same-origin');
  return r;
}
