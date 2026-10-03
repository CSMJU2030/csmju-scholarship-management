import type { NextConfig } from 'next';

/**
 * หน้าเว็บส่งต่อ /api/* และ /auth/* ไป backend (NestJS) — ผู้ใช้เห็น origin เดียว
 * คุกกี้ SSO (<ชื่อระบบ>_access_token) จึงอยู่ที่ origin นี้ และ frontend ไม่ต่อฐานข้อมูลเอง (ARC-01)
 */
const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://127.0.0.1:4227').replace(/\/+$/, '');

const nextConfig: NextConfig = {
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
