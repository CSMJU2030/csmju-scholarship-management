'use client';

import type { components } from './api-types';

/** type ทั้งหมด generate จาก backend/openapi.json (pnpm --filter frontend generate:api-types) */
export type Schemas = components['schemas'];
export type Me = Schemas['MeDto'];
export type Scholarship = Schemas['ScholarshipDto'];
export type RequestSummary = Schemas['RequestSummaryDto'];
export type RequestDetail = Schemas['RequestDetailDto'];
export type LookupItem = Schemas['LookupItemDto'];
export type Attachment = Schemas['AttachmentDto'];
export type RequestStatistics = Schemas['RequestStatisticsDto'];
export type PaginationMeta = Schemas['PaginationMetaDto'];
export type CreateRequestBody = Schemas['CreateRequestDto'];
export type CreateScholarshipBody = Schemas['CreateScholarshipDto'];
export type UpdateScholarshipBody = Schemas['UpdateScholarshipDto'];
export type UpdateRequestBody = Schemas['UpdateRequestDto'];

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK';

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: { code: ErrorCode; message: string; details?: string[] };
}

export interface Page<T> {
  items: T[];
  meta: PaginationMeta;
}

async function send<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  let response: Response;
  try {
    // คุกกี้ session เป็น HttpOnly — เบราว์เซอร์แนบให้เอง frontend ไม่แตะ token
    response = await fetch(path, { credentials: 'same-origin', ...init });
  } catch {
    throw new ApiError('NETWORK', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง', 0);
  }
  const body = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || body.success !== true) {
    const code = body.error?.code ?? (response.status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
    throw new ApiError(code, body.error?.message ?? `HTTP ${response.status}`, response.status, body.error?.details ?? []);
  }
  return body;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const api = {
  async get<T>(path: string): Promise<T> {
    return (await send<T>(path)).data as T;
  },
  async page<T>(path: string): Promise<Page<T>> {
    const body = await send<T[]>(path);
    return { items: body.data ?? [], meta: body.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 } };
  },
  async post<T>(path: string, body: unknown): Promise<T> {
    return (await send<T>(path, json('POST', body))).data as T;
  },
  async patch<T>(path: string, body: unknown): Promise<T> {
    return (await send<T>(path, json('PATCH', body))).data as T;
  },
  async delete<T>(path: string): Promise<T> {
    return (await send<T>(path, { method: 'DELETE' })).data as T;
  },
  async upload<T>(path: string, form: FormData): Promise<T> {
    return (await send<T>(path, { method: 'POST', body: form })).data as T;
  },
};

/** ดึงทุกหน้าของ collection (ใช้กับรายการที่ไม่ยาวมาก เช่น ข้อมูลอ้างอิง) */
export async function fetchAll<T>(path: string, limit = 100): Promise<T[]> {
  const sep = path.includes('?') ? '&' : '?';
  const first = await api.page<T>(`${path}${sep}page=1&limit=${limit}`);
  const items = [...first.items];
  for (let page = 2; page <= first.meta.totalPages; page += 1) {
    items.push(...(await api.page<T>(`${path}${sep}page=${page}&limit=${limit}`)).items);
  }
  return items;
}

// ------------------------------------------------------------------ SSO

const RESSO_KEY = 'csmju_scholarship_resso_at';

/** เริ่ม SSO กับพอร์ทัลผ่าน /auth/login ของระบบนี้ (top-level navigation เท่านั้น — auth-contract ข้อ 7) */
export function loginUrl(next?: string): string {
  const target = next ?? `${window.location.pathname}${window.location.search}`;
  return `/auth/login?next=${encodeURIComponent(target)}`;
}

/**
 * Silent re-SSO เมื่อ API ตอบ 401 — ทำเฉพาะเมื่อรู้แน่ว่าพอร์ทัล CSMJU2030 ออนไลน์อยู่
 * (ถ้าพอร์ทัลปิดอยู่ การ redirect จะพาไปหน้าเว็บที่เปิดไม่ได้) และถ้าเพิ่งกลับมาไม่ถึง 30 วินาทีแล้วยัง 401
 * ให้หยุด (คืน false) เพื่อให้หน้าจอแสดงทางเข้าผ่านพอร์ทัลแทนการวนไม่จบ
 */
export function reSignIn(portalReachable: boolean, next?: string): boolean {
  if (!portalReachable) return false;
  try {
    const last = Number(window.sessionStorage.getItem(RESSO_KEY) ?? 0);
    if (Date.now() - last < 30_000) return false;
    window.sessionStorage.setItem(RESSO_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.assign(loginUrl(next));
  return true;
}

/** แจ้ง AppShell ว่า session หมดอายุระหว่างใช้งาน (AppShell ตัดสินใจเองว่าจะ re-SSO หรือแสดงทางเข้าพอร์ทัล) */
export const SESSION_EXPIRED_EVENT = 'csmju:session-expired';
export function notifySessionExpired() {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

// ------------------------------------------------------------------ ข้อความ error (ui-design-system.md ข้อ 9.3)

export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง';
  switch (error.code) {
    case 'FORBIDDEN':
      return 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบย่อยนี้';
    case 'NOT_FOUND':
      return 'ไม่พบข้อมูลที่คุณกำลังค้นหา อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง';
    case 'VALIDATION_ERROR':
    case 'CONFLICT':
    case 'BAD_REQUEST':
      return error.message;
    case 'TOO_MANY_REQUESTS':
      return 'มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่';
    case 'NETWORK':
      return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง';
    case 'UNAUTHORIZED':
      return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง';
    default:
      return 'ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง หากยังพบปัญหา กรุณาแจ้งผู้ดูแลระบบ';
  }
}
