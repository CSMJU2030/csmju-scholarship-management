import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../permissions';

export const PERMISSIONS_KEY = 'requiredPermissions';
/** ต้องมีอย่างน้อยหนึ่งสิทธิ์ในรายการ (service ตรวจ ownership ของ :own ต่ออีกชั้น) */
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
