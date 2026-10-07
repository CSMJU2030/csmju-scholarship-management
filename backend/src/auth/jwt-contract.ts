/**
 * ค่าคงที่ของสัญญา token — ตรงกับ standards/contracts/jwt-contract.json (สัญญา auth 1.2 · standards 1.7.0)
 * แก้ค่าได้ผ่าน env เท่านั้น การเปลี่ยนค่าคือ breaking change ของทั้งแพลตฟอร์ม
 */
export const JWT_CONTRACT = {
  algorithm: 'RS256',
  issuer: process.env.CORE_HUB_ISSUER ?? 'core-hub',
  audience: process.env.CORE_HUB_AUDIENCE ?? 'csmju2030',
  jwksPath: '/api/v1/.well-known/jwks.json',
  clockToleranceSec: 60,
  /** ขั้น 9: exp − iat ต้องไม่เกินค่านี้ (+clockToleranceSec) — กัน refresh token ถูกใช้แทน access token */
  maxTokenLifetimeSec: 900,
  /** sub เป็น string ทึบ ยาวไม่เกิน 64 (ไม่ใช่ UUID เสมอไป) */
  maxSubLength: 64,
  sso: {
    coreHubWebAuthorizePath: '/sso/authorize',
    coreHubWebLogoutPath: '/logout',
    subsystemLoginPath: '/auth/login',
    subsystemCallbackPath: '/auth/callback',
    sessionCookieSuffix: '_access_token',
    stateCookieSuffix: '_sso_state',
    stateTtlSec: 600,
  },
} as const;

// core role 6 ค่า (vocabulary.json 1.1)
export const CORE_ROLES = ['student', 'alumni', 'staff', 'lecturer', 'guest', 'admin'] as const;
export type CoreRole = (typeof CORE_ROLES)[number];
