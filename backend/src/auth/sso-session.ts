import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { JWT_CONTRACT } from './jwt-contract';

/** ชื่อคุกกี้ = ชื่อระบบ (แทน - ด้วย _) + suffix ตามสัญญา (auth-contract.md ข้อ 5.1–5.2) */
export function cookieNames(subsystemName: string) {
  const prefix = subsystemName.replace(/-/g, '_');
  return {
    session: `${prefix}${JWT_CONTRACT.sso.sessionCookieSuffix}`,
    state: `${prefix}${JWT_CONTRACT.sso.stateCookieSuffix}`,
  };
}

/** อ่านค่าคุกกี้จาก header เอง (ไม่พึ่ง cookie-parser ซึ่งไม่อยู่ใน whitelist) */
export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) {
      try {
        return decodeURIComponent(part.slice(index + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export interface CookieOptions {
  maxAgeSec: number;
  path: string;
  secure: boolean;
}

export function serializeCookie(name: string, value: string, options: CookieOptions): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${Math.max(0, Math.floor(options.maxAgeSec))}`,
    `Path=${options.path}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

export const toBase64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
export const fromBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

/** เทียบแบบ constant-time */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

const SELF_ORIGIN = 'http://subsystem.invalid';

/**
 * กฎของ next (auth-contract.md ข้อ 5.2) — ผ่านครบจึงใช้ได้ ไม่ผ่านคืน fallback
 */
export function safeNextPath(next: unknown, fallback = '/'): string {
  if (typeof next !== 'string') return fallback;
  if (next.length < 1 || next.length > 512) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  for (let i = 0; i < next.length; i += 1) {
    const code = next.charCodeAt(i);
    if (code <= 31 || code === 127) return fallback;
  }
  let url: URL;
  try {
    url = new URL(next, SELF_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== SELF_ORIGIN) return fallback;
  if (url.pathname === '/auth' || url.pathname.startsWith('/auth/')) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
