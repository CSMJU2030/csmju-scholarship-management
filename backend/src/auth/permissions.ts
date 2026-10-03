/**
 * สิทธิ์ของระบบทุนการศึกษา (Layer 2) — รูปแบบ <resource>:<action>[:own|:any]
 * เมทริกซ์ทั้งหมดอยู่ที่ไฟล์นี้ไฟล์เดียว (authorization.md ข้อ 6)
 * ":own" หมายถึง record.core_user_id === token.sub และ service ต้องตรวจกับข้อมูลจริงอีกชั้น
 */
export enum Permission {
  REFERENCE_READ = 'reference:read',
  SCHOLARSHIP_READ = 'scholarship:read',
  SCHOLARSHIP_CREATE = 'scholarship:create',
  SCHOLARSHIP_UPDATE = 'scholarship:update',
  SCHOLARSHIP_DELETE = 'scholarship:delete',
  REQUEST_CREATE_OWN = 'request:create:own',
  REQUEST_READ_OWN = 'request:read:own',
  REQUEST_READ_ANY = 'request:read:any',
  REQUEST_UPDATE_OWN = 'request:update:own',
  REQUEST_UPDATE_ANY = 'request:update:any',
  ATTACHMENT_CREATE_OWN = 'attachment:create:own',
  ATTACHMENT_READ_OWN = 'attachment:read:own',
  ATTACHMENT_READ_ANY = 'attachment:read:any',
  STATISTICS_READ = 'statistics:read',
}

export type SubsystemRole = 'STUDENT' | 'STAFF' | 'ADMIN';

const STUDENT: readonly Permission[] = [
  Permission.REFERENCE_READ,
  Permission.SCHOLARSHIP_READ,
  Permission.REQUEST_CREATE_OWN,
  Permission.REQUEST_READ_OWN,
  Permission.REQUEST_UPDATE_OWN,
  Permission.ATTACHMENT_CREATE_OWN,
  Permission.ATTACHMENT_READ_OWN,
];

const STAFF: readonly Permission[] = [
  Permission.REFERENCE_READ,
  Permission.SCHOLARSHIP_READ,
  Permission.SCHOLARSHIP_CREATE,
  Permission.SCHOLARSHIP_UPDATE,
  Permission.REQUEST_READ_ANY,
  Permission.REQUEST_UPDATE_ANY,
  Permission.ATTACHMENT_READ_ANY,
  Permission.STATISTICS_READ,
];

const ADMIN: readonly Permission[] = [...STAFF, Permission.SCHOLARSHIP_DELETE];

export const ROLE_PERMISSIONS: Record<SubsystemRole, readonly Permission[]> = { STUDENT, STAFF, ADMIN };

export function permissionsOf(role: SubsystemRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(granted: readonly Permission[], ...required: Permission[]): boolean {
  return required.some((permission) => granted.includes(permission));
}
