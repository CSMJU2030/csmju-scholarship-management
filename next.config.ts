import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // เพิ่มบรรทัดนี้ลงไปเพื่ออนุญาต IP ของคุณ
  allowedDevOrigins: ['26.155.53.96'],
};

export default nextConfig;