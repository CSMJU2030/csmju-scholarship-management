import type { Request } from 'express';

/**
 * token ของผู้ใช้ที่ผ่านการตรวจแล้ว — ใช้เรียก Core Hub ในนามผู้ใช้เท่านั้น (auth-contract 1.2 ข้อ 6.1)
 * เก็บใน WeakMap ผูกกับ request: ไม่อยู่ใน request.user · ไม่ถูก serialize ลง log/response · หายไปพร้อม request
 * ห้ามเก็บลงฐาน ห้ามส่งต่อระบบอื่น ห้าม log
 */
const tokens = new WeakMap<Request, string>();

export function attachUserToken(request: Request, token: string): void {
  tokens.set(request, token);
}

export function userTokenOf(request: Request): string | undefined {
  return tokens.get(request);
}
