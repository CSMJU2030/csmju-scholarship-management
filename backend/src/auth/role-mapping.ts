import type { CoreRole } from './jwt-contract';
import type { SubsystemRole } from './permissions';

/**
 * core role → subsystem role · ต้องตรงกับ default_role_mapping ในทะเบียน Core Hub
 * core role ที่ไม่อยู่ในตาราง (alumni, guest) เข้าระบบนี้ไม่ได้ → 403 FORBIDDEN
 * lecturer (อาจารย์ที่ปรึกษา/กรรมการทุน) ได้สิทธิ์เท่าเจ้าหน้าที่
 */
export const CORE_ROLE_TO_SUBSYSTEM_ROLE: Partial<Record<CoreRole, SubsystemRole>> = {
  student: 'STUDENT',
  staff: 'STAFF',
  lecturer: 'STAFF',
  admin: 'ADMIN',
};

export function mapCoreRole(role: string): SubsystemRole | undefined {
  return CORE_ROLE_TO_SUBSYSTEM_ROLE[role as CoreRole];
}
