/**
 * สร้าง backend/openapi.json จาก decorator ของ controller (tech-stack.md ข้อ 3 · CI กฎ API-01)
 *   pnpm --filter backend generate:openapi
 * ไม่ต่อฐานข้อมูล — ใช้ preview mode ซึ่งไม่สร้าง provider
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { buildOpenApi, configureApp, OUTSIDE_API_PREFIX } from '../src/app.setup';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  app.setGlobalPrefix('api', { exclude: OUTSIDE_API_PREFIX });
  configureApp(app);
  const document = buildOpenApi(app);
  writeFileSync(resolve(__dirname, '..', 'openapi.json'), `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
  console.log('openapi.json written');
}

void main();
