import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { forbidden } from '../../common/api-exception';
import type { AuthenticatedUser } from '../core-hub-identity';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { hasPermission, type Permission } from '../permissions';

/** ตรวจว่ามีอย่างน้อยหนึ่ง permission ที่ route ต้องการ · ไม่พอ → 403 FORBIDDEN (ไม่ใช่ 401/404) */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>().user;
    if (!user || !hasPermission(user.permissions, ...required)) {
      throw forbidden('You do not have permission to perform this action');
    }
    return true;
  }
}
