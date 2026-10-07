import type { CoreRole } from './jwt-contract';
import type { Permission, SubsystemRole } from './permissions';

/** claim ที่ระบบนี้ใช้จาก access token (claim อื่นที่ Core Hub เพิ่มมาจะถูกละไว้ ไม่ปฏิเสธ) */
export interface CoreHubClaims {
  sub: string;
  email: string;
  role: string;
  sid?: string;
  exp: number;
  iat: number;
}

/** ตัวตนของผู้เรียกหลังผ่านการตรวจ token แล้ว — แนบไว้ที่ request.user */
export interface AuthenticatedUser {
  coreUserId: string;
  email: string;
  coreRole: CoreRole;
  subsystemRole: SubsystemRole;
  permissions: readonly Permission[];
  expiresAt: string;
}
