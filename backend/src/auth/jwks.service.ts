import { Inject, Injectable, Logger } from '@nestjs/common';
import { importJWK, type JWK, type KeyLike } from 'jose';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { InvalidTokenError } from './auth.errors';
import { JWT_CONTRACT } from './jwt-contract';

const CACHE_TTL_MS = 10 * 60 * 1000; // แคชกุญแจ 10 นาที
const MIN_REFRESH_INTERVAL_MS = 30 * 1000; // รีเฟรชได้ไม่ถี่กว่า 30 วินาที
const FETCH_TIMEOUT_MS = 5000;

/**
 * JWKS client ตาม auth-contract.md ข้อ 4.1
 *  - แคชกุญแจ ไม่ยิง Core Hub ทุก request
 *  - เลือกกุญแจด้วย kid เสมอ · เจอ kid ใหม่ให้รีเฟรช 1 ครั้งแล้วค่อยปฏิเสธ
 *  - จำกัดอัตรารีเฟรช · Core Hub ล่มชั่วคราวใช้กุญแจเดิมต่อได้
 *  - ปฏิเสธ JWK ที่มี private material (d) หรือไม่ใช่ RSA
 */
@Injectable()
export class JwksService {
  private readonly logger = new Logger(JwksService.name);
  private keys = new Map<string, KeyLike | Uint8Array>();
  private fetchedAt = 0;
  private lastAttemptAt = 0;
  private inflight: Promise<void> | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  get jwksUrl(): string {
    return `${this.config.coreHubUrl}${JWT_CONTRACT.jwksPath}`;
  }

  async getKey(kid: string): Promise<KeyLike | Uint8Array> {
    if (Date.now() - this.fetchedAt > CACHE_TTL_MS) {
      await this.refresh();
    }
    let key = this.keys.get(kid);
    if (!key) {
      await this.refresh();
      key = this.keys.get(kid);
    }
    if (!key) throw new InvalidTokenError('unknown kid');
    return key;
  }

  private async refresh(): Promise<void> {
    if (Date.now() - this.lastAttemptAt < MIN_REFRESH_INTERVAL_MS) return;
    if (!this.inflight) {
      this.inflight = this.load().finally(() => {
        this.inflight = null;
      });
    }
    await this.inflight;
  }

  private async load(): Promise<void> {
    this.lastAttemptAt = Date.now();
    try {
      const response = await fetch(this.jwksUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`JWKS responded ${response.status}`);
      const body = (await response.json()) as { keys?: JWK[] };
      if (!Array.isArray(body.keys)) throw new Error('JWKS body has no keys[]');

      const next = new Map<string, KeyLike | Uint8Array>();
      for (const jwk of body.keys) {
        if (!jwk.kid || jwk.kty !== 'RSA' || 'd' in jwk) continue;
        if (jwk.use !== undefined && jwk.use !== 'sig') continue;
        if (jwk.alg && jwk.alg !== JWT_CONTRACT.algorithm) continue;
        next.set(jwk.kid, await importJWK(jwk, JWT_CONTRACT.algorithm));
      }
      this.keys = next;
      this.fetchedAt = Date.now();
    } catch (error) {
      // ใช้กุญแจที่แคชไว้ต่อ (ถ้ามี)
      this.logger.warn(`JWKS refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
