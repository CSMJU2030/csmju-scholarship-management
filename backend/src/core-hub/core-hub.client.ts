import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ApiException, forbidden, notFound, unauthorized } from '../common/api-exception';
import { ErrorCode } from '../common/error-codes';
import { APP_CONFIG, AppConfig } from '../config/configuration';

const TIMEOUT_MS = Number(process.env.CORE_HUB_DATA_REQUEST_TIMEOUT_MS ?? 5000);

/**
 * เรียก Core Hub จาก backend ด้วย token ของผู้ใช้คนที่ส่ง request มา (reference-data.md 1.3 ข้อ 7)
 *  - เฉพาะ endpoint ใน allowlist (ข้อ 2) — ระบบนี้ใช้แค่ /people/me และ /people/:personCode
 *  - timeout 5 วินาที · อ่าน success/data และข้าม key ที่ไม่รู้จัก · ไม่ retry
 *  - 401 → 401 (ผู้ใช้ต้อง SSO ใหม่) · 403/404 → ส่งต่อให้ผู้เรียกตัดสิน · 429/5xx/ต่อไม่ติด → 503 + Retry-After
 *  - ห้าม log token หรือ URL ที่มี query
 */
@Injectable()
export class CoreHubClient {
  private readonly logger = new Logger('CoreHub');

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  async get<T>(path: string, token: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.config.coreHubUrl}/api/v1${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      this.logger.warn(JSON.stringify({ event: 'core_data.request.failure', path: path.split('?')[0], reason: 'unreachable' }));
      throw unavailable(30);
    }

    if (response.status === 401) throw unauthorized('เซสชันของพอร์ทัลหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง');
    if (response.status === 403) throw forbidden('บัญชีของคุณไม่มีสิทธิ์ดูข้อมูลนี้ในพอร์ทัล');
    if (response.status === 404) throw notFound('ไม่พบในข้อมูลกลาง');
    if (response.status === 429 || response.status >= 500) {
      const retryAfter = Number(response.headers.get('retry-after') ?? 30) || 30;
      this.logger.warn(JSON.stringify({ event: 'core_data.request.failure', path: path.split('?')[0], status: response.status }));
      throw unavailable(retryAfter);
    }
    const body = (await response.json().catch(() => null)) as { success?: boolean; data?: T } | null;
    if (!response.ok || !body || body.success !== true) {
      this.logger.warn(JSON.stringify({ event: 'core_data.request.failure', path: path.split('?')[0], status: response.status }));
      throw unavailable(30);
    }
    return body.data as T;
  }
}

export class CoreHubUnavailableError extends ApiException {
  constructor(readonly retryAfterSec: number) {
    super(HttpStatus.SERVICE_UNAVAILABLE, ErrorCode.SERVICE_UNAVAILABLE, 'ติดต่อพอร์ทัล CSMJU2030 ไม่ได้ชั่วคราว กรุณาลองใหม่อีกครั้ง');
  }
}

const unavailable = (retryAfterSec: number) => new CoreHubUnavailableError(retryAfterSec);
