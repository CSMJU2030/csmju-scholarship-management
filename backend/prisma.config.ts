import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    // ค่าจริงอยู่ใน backend/.env (ห้าม commit) · ว่างได้ตอน prisma generate ซึ่งไม่ต่อฐานข้อมูล
    url: process.env.DATABASE_URL ?? '',
  },
});
