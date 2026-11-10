import { getSession, json } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  const s = await getSession(context);
  if (!s) return json({ ok: false, signedIn: false }, 401);
  return json({ ok: true, signedIn: true, email: s.email, role: s.role, expiresAt: s.exp });
}
