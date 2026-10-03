import { Controller, Get, HttpStatus, Inject, Post, Query, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { ErrorCode } from '../common/error-codes';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { Public } from './decorators/public.decorator';
import { JWT_CONTRACT } from './jwt-contract';
import { mapCoreRole } from './role-mapping';
import {
  cookieNames,
  fromBase64Url,
  readCookie,
  safeEqual,
  safeNextPath,
  serializeCookie,
  toBase64Url,
} from './sso-session';

const DEFAULT_LANDING = '/';

/** หน้าเมื่อ state ไม่ตรง (เช่น เปิดลิงก์ค้างไว้นานหรือเบราว์เซอร์ไม่เก็บคุกกี้) — ไม่มีสคริปต์ ไม่ redirect เอง */
const page = (title: string, text: string, action: string) => `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>เข้าสู่ระบบไม่สำเร็จ | ทุนการศึกษาและสวัสดิการ</title>
<style>body{font-family:system-ui,'Noto Sans Thai',sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#f5f7fb;color:#191c20}
main{max-width:420px;margin:16px;padding:32px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.08);text-align:center}
a{display:inline-block;margin-top:20px;padding:12px 20px;border-radius:8px;background:#2154d9;color:#fff;text-decoration:none;font-weight:600}</style></head>
<body><main><h1 style="font-size:20px">${title}</h1>
<p>${text}</p>
${action}</main></body></html>`;
const RETRY_PAGE = page('เข้าสู่ระบบไม่สำเร็จ', 'ลิงก์เข้าสู่ระบบหมดอายุหรือไม่ถูกต้อง กรุณาลองอีกครั้ง', '<a href="/auth/login">เข้าสู่ระบบอีกครั้ง</a>');
const FORBIDDEN_PAGE = page(
  'บัญชีนี้ใช้ระบบทุนการศึกษาไม่ได้',
  'ระบบทุนการศึกษาและสวัสดิการเปิดให้นักศึกษา อาจารย์ และเจ้าหน้าที่เท่านั้น หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อเจ้าหน้าที่สาขา',
  '<a href="/">กลับหน้าแรก</a>',
);

/**
 * Central SSO ฝั่งระบบย่อย (auth-contract.md ข้อ 5) — อยู่นอก prefix /api และเป็น public
 *   GET  /auth/login     สร้าง state → 302 ไปเว็บ Core Hub /sso/authorize
 *   GET  /auth/callback  ตรวจ state + token → ตั้งคุกกี้ session → 302 ไป next
 *   POST /auth/logout    ลบคุกกี้ → 303 ไปเว็บ Core Hub /logout
 * ระบบย่อยไม่มีฟอร์มรหัสผ่าน ไม่ออก token และไม่มีตาราง session ของตัวเอง
 */
@ApiExcludeController()
@Controller('auth')
export class SsoCallbackController {
  private readonly cookies: { session: string; state: string };
  private readonly secure: boolean;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly verifier: CoreHubTokenVerifier,
  ) {
    this.cookies = cookieNames(config.subsystemName);
    this.secure = config.nodeEnv === 'production';
  }

  @Public()
  @Get('login')
  login(@Query('next') next: string | undefined, @Res() response: Response): void {
    this.noStore(response);
    const state = randomBytes(32).toString('base64url');
    const nextPath = safeNextPath(next, DEFAULT_LANDING);
    response.setHeader(
      'Set-Cookie',
      serializeCookie(this.cookies.state, `${state}.${toBase64Url(nextPath)}`, {
        maxAgeSec: JWT_CONTRACT.sso.stateTtlSec,
        path: JWT_CONTRACT.sso.subsystemCallbackPath,
        secure: this.secure,
      }),
    );
    const target = new URL(`${this.config.coreHubWebUrl}${JWT_CONTRACT.sso.coreHubWebAuthorizePath}`);
    target.searchParams.set('subsystem', this.config.subsystemName);
    target.searchParams.set('state', state);
    response.redirect(HttpStatus.FOUND, target.toString());
  }

  @Public()
  @Get('callback')
  async callback(
    @Query('access_token') accessToken: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    this.noStore(response);
    response.setHeader('Referrer-Policy', 'no-referrer');

    if (!accessToken) {
      this.fail(response, HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, 'Missing access_token');
      return;
    }

    // เริ่มจาก Core Hub (ไม่มี state): ทิ้ง token · ไม่แตะคุกกี้ใด ๆ · เริ่ม flow ใหม่ที่ /auth/login
    if (!state) {
      response.redirect(HttpStatus.FOUND, JWT_CONTRACT.sso.subsystemLoginPath);
      return;
    }

    // เผาคุกกี้ state ทิ้งก่อนตรวจเสมอ (ใช้ได้ครั้งเดียว)
    const clearState = serializeCookie(this.cookies.state, '', {
      maxAgeSec: 0,
      path: JWT_CONTRACT.sso.subsystemCallbackPath,
      secure: this.secure,
    });
    response.setHeader('Set-Cookie', [clearState]);

    const stored = readCookie(request, this.cookies.state) ?? '';
    const dot = stored.indexOf('.');
    const storedState = dot > 0 ? stored.slice(0, dot) : '';
    if (!storedState || !safeEqual(storedState, state)) {
      // 401 · ห้าม redirect ซ้ำ (กันวน) · เบราว์เซอร์ได้หน้า HTML ที่มีปุ่มเข้าสู่ระบบอีกครั้ง (auth-contract 1.2 ข้อ 5.1)
      if (request.accepts(['json', 'html']) === 'html') {
        response.status(HttpStatus.UNAUTHORIZED).type('html').send(RETRY_PAGE);
        return;
      }
      this.fail(response, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, 'Invalid sign-in state');
      return;
    }

    let claims;
    try {
      claims = await this.verifier.verify(accessToken);
    } catch {
      this.fail(response, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, 'Missing or invalid token');
      return;
    }

    if (!mapCoreRole(claims.role)) {
      if (request.accepts(['json', 'html']) === 'html') {
        response.status(HttpStatus.FORBIDDEN).type('html').send(FORBIDDEN_PAGE);
        return;
      }
      this.fail(response, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, 'Your role cannot use this subsystem');
      return;
    }

    let nextPath = DEFAULT_LANDING;
    try {
      nextPath = safeNextPath(fromBase64Url(stored.slice(dot + 1)), DEFAULT_LANDING);
    } catch {
      nextPath = DEFAULT_LANDING;
    }

    const maxAge = claims.exp - Math.floor(Date.now() / 1000);
    response.setHeader('Set-Cookie', [
      clearState,
      serializeCookie(this.cookies.session, accessToken, { maxAgeSec: maxAge, path: '/', secure: this.secure }),
    ]);
    response.redirect(HttpStatus.FOUND, nextPath);
  }

  @Public()
  @Post('logout')
  logout(@Res() response: Response): void {
    this.noStore(response);
    response.setHeader(
      'Set-Cookie',
      serializeCookie(this.cookies.session, '', { maxAgeSec: 0, path: '/', secure: this.secure }),
    );
    response.redirect(HttpStatus.SEE_OTHER, `${this.config.coreHubWebUrl}${JWT_CONTRACT.sso.coreHubWebLogoutPath}`);
  }

  private noStore(response: Response): void {
    response.setHeader('Cache-Control', 'no-store');
  }

  private fail(response: Response, status: number, code: string, message: string): void {
    response.status(status).json({ success: false, error: { code, message } });
  }
}
