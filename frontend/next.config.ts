import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * หน้าเว็บส่งต่อ /api/* และ /auth/* ไป backend (NestJS) — ผู้ใช้เห็น origin เดียว
 * คุกกี้ SSO (<ชื่อระบบ>_access_token) จึงอยู่ที่ origin นี้ และ frontend ไม่ต่อฐานข้อมูลเอง (ARC-01)
 *
 * rewrites ถูกฝังตอน next build — BACKEND_URL อ่านตอน build เท่านั้น:
 * dev ใช้ค่าจาก .env.local (http://127.0.0.1:4227) · image ใช้ http://api:4000 จาก frontend/Dockerfile (deployment.md ข้อ 3.2)
 */
const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://127.0.0.1:4227').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  // deployment.md ข้อ 3: image มีแค่ server ที่ trace แล้ว (DEP-04)
  output: 'standalone',
  // pnpm เก็บ dependency ไว้ที่รากของ workspace — trace ต้องเริ่มจากราก ไม่งั้น standalone ขาด package
  outputFileTracingRoot: path.join(__dirname, '..'),
  // ใส่ IP/โดเมนที่เปิดหน้า dev จากเครื่องอื่นได้ใน ALLOWED_DEV_ORIGINS (คั่นด้วย ,)
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/auth/:path*', destination: `${BACKEND_URL}/auth/:path*` },
    ];
  },
  async redirects() {
    return [{ source: '/scholarship/student', destination: '/welfare/form', permanent: false }];
  },
};

export default nextConfig;
