import { CanActivate, ExecutionContext, Inject, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { forbidden, unauthorized } from '../../common/api-exception';
import { APP_CONFIG, AppConfig } from '../../config/configuration';
import type { AuthenticatedUser } from '../core-hub-identity';
import { CoreHubTokenVerifier } from '../core-hub-token.verifier';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { CoreRole } from '../jwt-contract';
import { permissionsOf } from '../permissions';
import { mapCoreRole } from '../role-mapping';
import { cookieNames, readCookie } from '../sso-session';
import { attachUserToken } from '../user-token';

/**
 * Guard ระดับ global — ทุก route ต้องมี token ยกเว้นที่ติด @Public()
 * รับ token จาก Authorization: Bearer ก่อน แล้วจึงดูคุกกี้ <ชื่อระบบ>_access_token (auth-contract.md ข้อ 6)
 * ไม่มี/ใช้ไม่ได้ → 401 · core role ที่ระบบไม่รับ → 403
 */
@Injectable()
export class CoreHubJwtGuard implements CanActivate {
  private readonly sessionCookie: string;
  private readonly logger = new Logger('Auth');

  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: CoreHubTokenVerifier,
    @Inject(APP_CONFIG) config: AppConfig,
  ) {
    this.sessionCookie = cookieNames(config.subsystemName).session;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(request);
    if (!token) throw unauthorized();

    let claims;
    try {
      claims = await this.verifier.verify(token);
    } catch (error) {
      // log-events.json: log แค่เหตุผลและ path — ห้าม log token · URL เต็ม · header (auth-contract ข้อ 5.1, 9)
      this.logger.warn(
        JSON.stringify({ event: 'jwt.verification.failure', reason: error instanceof Error ? error.message : 'unknown', path: request.path }),
      );
      throw unauthorized();
    }

    const subsystemRole = mapCoreRole(claims.role);
    if (!subsystemRole) {
      this.logger.warn(JSON.stringify({ event: 'authorization.role_mapping_failed', sub: claims.sub, coreRole: claims.role }));
      throw forbidden('บทบาทของคุณไม่มีสิทธิ์เข้าใช้ระบบนี้');
    }
    // เก็บ token ไว้เรียก Core Hub ในนามผู้ใช้คนนี้ (เฉพาะ endpoint ใน allowlist) — ไม่อยู่ใน request.user จึงไม่หลุดไปกับ log/response
    attachUserToken(request, token);

    request.user = {
      coreUserId: claims.sub,
      email: claims.email,
      coreRole: claims.role as CoreRole,
      subsystemRole,
      permissions: permissionsOf(subsystemRole),
      expiresAt: new Date(claims.exp * 1000).toISOString(),
    };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (header !== undefined) {
      const match = /^Bearer\s+(\S+)$/i.exec(header);
      return match ? match[1] : undefined;
    }
    return readCookie(request, this.sessionCookie);
  }
}
