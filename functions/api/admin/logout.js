import { sessionCookie, sameOrigin, json } from '../../_lib/auth.js';

export async function onRequestPost({ request }) {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Bad origin' }, 403);
  const clear = sessionCookie('', 0);
  const type = request.headers.get('Content-Type') || '';
  if (!type.includes('application/json')) {
    return new Response(null, { status: 303, headers: { Location: '/admin/login/?signedout=1', 'Set-Cookie': clear, 'Cache-Control': 'no-store' } });
  }
  return json({ ok: true }, 200, { 'Set-Cookie': clear });
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
}
