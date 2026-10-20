import type { Env } from '../types';

const COOKIE = 'aliza_admin_token';
const SESSION_HOURS = 72;

function randomToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getTokenFromRequest(c: { req: { header: (n: string) => string | undefined } }): string | null {
  const cookie = c.req.header('Cookie') || '';
  const m = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function createSession(db: D1Database): Promise<string> {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000).toISOString();
  await db.prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)').bind(token, expires).run();
  return token;
}

export async function validateSession(db: D1Database, token: string | null): Promise<boolean> {
  if (!token) return false;
  const row = await db
    .prepare(`SELECT id FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')`)
    .bind(token)
    .first();
  return !!row;
}

export async function destroySession(db: D1Database, token: string | null): Promise<void> {
  if (!token) return;
  await db.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run();
}

export function sessionCookie(token: string, maxAgeSec = SESSION_HOURS * 3600): string {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function checkPassword(env: Env, username: string, password: string): boolean {
  const expectedUser = env.ADMIN_USERNAME || 'admin';
  const expectedPass = env.ADMIN_PASSWORD || 'AlizaTraders@2026';
  return username === expectedUser && password === expectedPass;
}
