import { Inject, Injectable } from "@nestjs/common";
import { APP_CONFIG, AppConfig } from "../config/configuration";

const CACHE_MS = 30_000;
const TIMEOUT_MS = 1_500;

/**
 * ตรวจว่า Core Hub (พอร์ทัล CSMJU2030) ออนไลน์อยู่หรือไม่ (ทั้ง API และเว็บ) — ให้หน้าเว็บเลือกได้ว่าจะพาผู้ใช้ไป
 * เข้าสู่ระบบผ่าน SSO หรือแจ้งว่าพอร์ทัลปิดอยู่ (แทนที่จะพาไปหน้าที่เปิดไม่ได้)
 */
@Injectable()
export class PortalStatusService {
  private cached: { reachable: boolean; at: number } | null = null;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  get webUrl(): string {
    return this.config.coreHubWebUrl;
  }

  async reachable(): Promise<boolean> {
    if (this.cached && Date.now() - this.cached.at < CACHE_MS)
      return this.cached.reachable;
    // ต้องออนไลน์ทั้ง API (ออก token) และเว็บพอร์ทัล (หน้า /sso/authorize ที่ผู้ใช้ถูกพาไป)
    const [api, web] = await Promise.all([
      this.probe(`${this.config.coreHubUrl}/api/v1/health`, true),
      this.probe(this.config.coreHubWebUrl, false),
    ]);
    const reachable = api && web;
    this.cached = { reachable, at: Date.now() };
    return reachable;
  }

  /** requireOk = ต้องได้ 2xx · ไม่งั้นแค่มีคำตอบ HTTP กลับมาก็ถือว่าออนไลน์ (หน้าเว็บอาจ redirect) */
  private async probe(url: string, requireOk: boolean): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: requireOk ? "GET" : "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return requireOk
        ? response.ok
        : response.status > 0 && response.status < 500;
    } catch {
      return false;
    }
  }
}
