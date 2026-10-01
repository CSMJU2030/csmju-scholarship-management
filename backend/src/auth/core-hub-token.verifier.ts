import { Inject, Injectable } from '@nestjs/common';
import { decodeProtectedHeader, jwtVerify } from 'jose';
import { APP_CONFIG, type AppConfig } from '../config/configuration';
import { InvalidTokenError } from './auth.errors';
import type { CoreHubClaims } from './core-hub-identity';
import { JwksService } from './jwks.service';
import { JWT_CONTRACT } from './jwt-contract';

/**
 * ตรวจ Core Hub access token ครบ 10 ขั้น (auth-contract.md 1.2 ข้อ 4)
 *  1 อ่าน token · 2 ถอด header · 3 บังคับ alg RS256 · 4 หากุญแจจาก JWKS ตาม kid
 *  5 ตรวจลายเซ็น (allow-list ซ้ำ) · 6 iss/aud · 7 exp (skew ≤ 60 วิ) · 8 sub ไม่ว่าง
 *  9 ต้องมี iat และ exp − iat ≤ 900 (+60) วินาที · 10 ถ้ามี azp ต้องเท่ากับชื่อระบบนี้
 * claim อื่นที่ไม่รู้จักต้องปล่อยผ่าน (Core Hub เพิ่ม claim ได้)
 * ห้ามข้ามขั้นใดแม้ในโหมด development
 */
@Injectable()
export class CoreHubTokenVerifier {
  constructor(
    private readonly jwks: JwksService,
    @Inject(APP_CONFIG) private readonly config: Pick<AppConfig, 'subsystemName'>,
  ) {}

  async verify(token: string): Promise<CoreHubClaims> {
    if (!token || token.split('.').length !== 3) throw new InvalidTokenError('malformed token');

    let header: ReturnType<typeof decodeProtectedHeader>;
    try {
      header = decodeProtectedHeader(token);
    } catch {
      throw new InvalidTokenError('malformed header');
    }

    if (header.alg !== JWT_CONTRACT.algorithm) throw new InvalidTokenError('unsupported algorithm');
    if (typeof header.kid !== 'string' || header.kid.length === 0) throw new InvalidTokenError('missing kid');

    const key = await this.jwks.getKey(header.kid);

    let payload: Record<string, unknown>;
    try {
      ({ payload } = await jwtVerify(token, key, {
        algorithms: [JWT_CONTRACT.algorithm],
        issuer: JWT_CONTRACT.issuer,
        audience: JWT_CONTRACT.audience,
        clockTolerance: JWT_CONTRACT.clockToleranceSec,
        requiredClaims: ['exp', 'sub', 'iat'],
      }));
    } catch {
      throw new InvalidTokenError('signature or claims rejected');
    }

    const { sub, email, role, sid, exp, iat, azp } = payload;
    // ขั้น 8 — sub เป็น string ทึบ ≤ 64 ตัว (ห้าม validate เป็น UUID)
    if (typeof sub !== 'string' || sub.trim().length === 0 || sub.length > JWT_CONTRACT.maxSubLength) {
      throw new InvalidTokenError('missing sub');
    }
    if (typeof exp !== 'number') throw new InvalidTokenError('missing exp');
    // ขั้น 9 — อายุ token
    if (typeof iat !== 'number') throw new InvalidTokenError('missing iat');
    if (exp - iat > JWT_CONTRACT.maxTokenLifetimeSec + JWT_CONTRACT.clockToleranceSec) {
      throw new InvalidTokenError('token_lifetime_exceeded');
    }
    // ขั้น 10 — azp (ตรวจเมื่อมี)
    if (azp !== undefined && azp !== this.config.subsystemName) throw new InvalidTokenError('invalid_azp');
    if (typeof role !== 'string') throw new InvalidTokenError('missing role');

    return {
      sub,
      email: typeof email === 'string' ? email : '',
      role,
      sid: typeof sid === 'string' ? sid : undefined,
      exp,
      iat,
    };
  }
}
