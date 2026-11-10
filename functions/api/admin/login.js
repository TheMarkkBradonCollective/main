import { loadAdmins, verifyPassword, signSession, sessionCookie, sameOrigin, json, sleep, SESSION_TTL_SECONDS } from '../../_lib/auth.js';

// Basic brute-force slowdown. Counters live per isolate (best effort): every
// failure costs a fixed delay, repeated failures from one IP add more, and
// after MAX_FAILS the IP is locked out for LOCK_MS.
const FAIL_DELAY_MS = 900;
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const attempts = new Map();

function attemptState(ip) {
  const now = Date.now();
  let s = attempts.get(ip);
  if (!s || now - s.first > WINDOW_MS) s = { first: now, fails: 0, lockedUntil: 0 };
  attempts.set(ip, s);
  if (attempts.size > 5000) attempts.clear();
  return s;
}

async function readCredentials(request) {
  const type = request.headers.get('Content-Type') || '';
  if (type.includes('application/json')) {
    const b = await request.json().catch(() => ({}));
    return { email: b.email, password: b.password, form: false };
  }
  const f = await request.formData().catch(() => null);
  return { email: f && f.get('email'), password: f && f.get('password'), form: true };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!sameOrigin(request)) return json({ ok: false, error: 'Bad origin' }, 403);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const state = attemptState(ip);
  if (state.lockedUntil > Date.now()) {
    await sleep(FAIL_DELAY_MS);
    return json({ ok: false, error: 'Too many attempts. Try again in a few minutes.' }, 429, {
      'Retry-After': String(Math.ceil((state.lockedUntil - Date.now()) / 1000)),
    });
  }

  const { email, password, form } = await readCredentials(request);
  const admins = loadAdmins(env);
  const wanted = String(email || '').trim().toLowerCase();
  const account = admins.find((a) => a.email === wanted);
  let ok = false;
  if (account && typeof password === 'string' && password.length > 0 && password.length <= 1024) {
    ok = await verifyPassword(password, account.hash);
  } else if (admins[0]) {
    // Spend the same work on unknown emails so timing doesn't reveal valid ones.
    await verifyPassword(String(password || 'x'), admins[0].hash);
  }

  if (!ok) {
    state.fails += 1;
    if (state.fails >= MAX_FAILS) state.lockedUntil = Date.now() + LOCK_MS;
    await sleep(FAIL_DELAY_MS * Math.min(state.fails, 4));
    if (form) return Response.redirect(new URL('/admin/login/?error=1', request.url).toString(), 303);
    return json({ ok: false, error: 'Wrong email or password.' }, 401);
  }

  attempts.delete(ip);
  const now = Math.floor(Date.now() / 1000);
  const token = await signSession(env, { sub: account.email, role: account.role, iat: now, exp: now + SESSION_TTL_SECONDS });
  const cookie = sessionCookie(token, SESSION_TTL_SECONDS);
  if (form) {
    return new Response(null, { status: 303, headers: { Location: '/admin/', 'Set-Cookie': cookie, 'Cache-Control': 'no-store' } });
  }
  return json({ ok: true, email: account.email, role: account.role, redirect: '/admin/' }, 200, { 'Set-Cookie': cookie });
}

export function onRequest() {
  return json({ ok: false, error: 'Method not allowed' }, 405, { Allow: 'POST' });
}
