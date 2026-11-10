/**
 * MBC Store admin auth helpers (Cloudflare Pages Functions, Web Crypto only).
 *
 * Accounts come from encrypted Pages env vars — never plaintext passwords:
 *   FOUNDER_EMAIL          founder's sign-in email
 *   FOUNDER_PASSWORD_HASH  "pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>"
 *   SESSION_SECRET         random string used to HMAC-sign session cookies
 *   ADMINS_JSON            optional, add more admins later:
 *                          [{"email":"a@b.c","hash":"pbkdf2-sha256$...","role":"admin"}]
 * Generate a hash locally with: node scripts/hash-admin-password.mjs
 */

export const COOKIE = '__Host-mbc_admin';
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
// Cloudflare Workers cap PBKDF2 at 100,000 iterations.
export const PBKDF2_MAX_ITERATIONS = 100000;

const enc = new TextEncoder();

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToString(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return new TextDecoder().decode(b64ToBytes(s));
}
function strToB64url(str) {
  return bytesToB64url(enc.encode(str));
}

/** Constant-time comparison of two byte arrays. */
export function timingSafeEqual(a, b) {
  a = new Uint8Array(a);
  b = new Uint8Array(b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Verify a password against a "pbkdf2-sha256$iter$salt$hash" string. */
export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256') return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations < 10000 || iterations > PBKDF2_MAX_ITERATIONS) return false;
  const salt = b64ToBytes(parts[2]);
  const expected = b64ToBytes(parts[3]);
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    expected.length * 8,
  );
  return timingSafeEqual(bits, expected);
}

/** All configured admin accounts. The founder always comes first. */
export function loadAdmins(env) {
  const admins = [];
  if (env.FOUNDER_EMAIL && env.FOUNDER_PASSWORD_HASH) {
    admins.push({ email: String(env.FOUNDER_EMAIL).trim().toLowerCase(), hash: env.FOUNDER_PASSWORD_HASH, role: 'founder' });
  }
  if (env.ADMINS_JSON) {
    try {
      for (const a of JSON.parse(env.ADMINS_JSON)) {
        if (a && a.email && a.hash) admins.push({ email: String(a.email).trim().toLowerCase(), hash: a.hash, role: a.role || 'admin' });
      }
    } catch (_) { /* ignore malformed ADMINS_JSON */ }
  }
  return admins;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signSession(env, payload) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET missing');
  const body = strToB64url(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(env.SESSION_SECRET), enc.encode(body));
  return `${body}.${bytesToB64url(sig)}`;
}

export async function verifySession(env, token) {
  if (!token || !env.SESSION_SECRET) return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  let sig = token.slice(dot + 1).replace(/-/g, '+').replace(/_/g, '/');
  while (sig.length % 4) sig += '=';
  let sigBytes;
  try { sigBytes = b64ToBytes(sig); } catch (_) { return null; }
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(env.SESSION_SECRET), sigBytes, enc.encode(body));
  if (!ok) return null;
  let payload;
  try { payload = JSON.parse(b64urlToString(body)); } catch (_) { return null; }
  if (!payload || typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
  // The account must still exist (removing an admin's env entry revokes their sessions).
  const still = loadAdmins(env).find((a) => a.email === payload.sub);
  if (!still) return null;
  return { email: payload.sub, role: still.role, exp: payload.exp, iat: payload.iat };
}

export function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function sessionCookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export async function getSession(context) {
  return verifySession(context.env, readCookie(context.request, COOKIE));
}

/** Reject cross-site POSTs (defence in depth on top of SameSite=Strict). */
export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // non-browser clients; cookie is still SameSite=Strict
  return origin === new URL(request.url).origin;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
