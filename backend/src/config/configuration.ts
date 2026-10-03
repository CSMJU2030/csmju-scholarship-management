/**
 * ค่าตั้งระบบทั้งหมดอ่านจาก environment (ห้ามฮาร์ดโค้ด secret / connection string — SEC-01)
 * ตรวจค่าที่จำเป็นตั้งแต่ตอนเริ่มระบบ ถ้าขาดจะไม่ยอมบูต
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  subsystemName: string;
  databaseUrl: string;
  coreHubUrl: string;
  coreHubWebUrl: string;
  corsOrigins: string[];
  uploadDir: string;
  maxUploadBytes: number;
}

const REQUIRED = ['DATABASE_URL', 'CORE_HUB_URL', 'CORE_HUB_WEB_URL'] as const;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')} (see backend/.env.example)`);
  }
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: Number(env.PORT ?? 4227),
    subsystemName: env.SUBSYSTEM_ID ?? env.SUBSYSTEM_NAME ?? 'csmju-scholarship',
    databaseUrl: env.DATABASE_URL as string,
    coreHubUrl: (env.CORE_HUB_URL as string).replace(/\/+$/, ''),
    coreHubWebUrl: (env.CORE_HUB_WEB_URL as string).replace(/\/+$/, ''),
    corsOrigins: (env.CORS_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    uploadDir: env.UPLOAD_DIR ?? 'uploads',
    maxUploadBytes: Number(env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
  };
}

export const APP_CONFIG = Symbol('APP_CONFIG');
