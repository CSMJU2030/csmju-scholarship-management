import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiException } from '../src/common/api-exception';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard';
import { Permission, permissionsOf } from '../src/auth/permissions';
import { mapCoreRole } from '../src/auth/role-mapping';

function contextFor(user: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('role mapping', () => {
  it('maps student/staff/admin and refuses alumni', () => {
    expect(mapCoreRole('student')).toBe('STUDENT');
    expect(mapCoreRole('staff')).toBe('STAFF');
    expect(mapCoreRole('admin')).toBe('ADMIN');
    expect(mapCoreRole('alumni')).toBeUndefined();
    expect(mapCoreRole('superuser')).toBeUndefined();
  });
});

describe('PermissionsGuard', () => {
  const reflector = new Reflector();

  it('answers 403 FORBIDDEN when a student tries to create a scholarship', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.SCHOLARSHIP_CREATE]);
    const guard = new PermissionsGuard(reflector);
    const user = { permissions: permissionsOf('STUDENT') };
    try {
      guard.canActivate(contextFor(user));
      fail('expected ForbiddenException');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiException);
      expect((error as ApiException).getStatus()).toBe(403);
      expect((error as ApiException).code).toBe('FORBIDDEN');
    }
  });

  it('lets staff create but not delete scholarships', () => {
    const staff = { permissions: permissionsOf('STAFF') };
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.SCHOLARSHIP_CREATE]);
    expect(new PermissionsGuard(reflector).canActivate(contextFor(staff))).toBe(true);
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.SCHOLARSHIP_DELETE]);
    expect(() => new PermissionsGuard(reflector).canActivate(contextFor(staff))).toThrow(ApiException);
  });

  it('accepts any one of several permissions (own or any)', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.REQUEST_READ_OWN, Permission.REQUEST_READ_ANY]);
    expect(new PermissionsGuard(reflector).canActivate(contextFor({ permissions: permissionsOf('STUDENT') }))).toBe(true);
  });
});
