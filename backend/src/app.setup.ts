import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import type { RouteInfo } from '@nestjs/common/interfaces';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';

/** /auth/* อยู่นอก prefix 'api' (api-conventions.md ข้อ 1) — /api/health และ /api/v1/* อยู่ใต้ prefix */
export const OUTSIDE_API_PREFIX: RouteInfo[] = [
  { path: 'auth/login', method: RequestMethod.GET },
  { path: 'auth/callback', method: RequestMethod.GET },
  { path: 'auth/logout', method: RequestMethod.POST },
];

/** ค่าที่ใช้ร่วมกันระหว่าง main.ts และการสร้าง openapi.json */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
}

export function buildOpenApi(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('csmju-scholarship API')
    .setDescription('ระบบทุนการศึกษาและสวัสดิการนักศึกษา สาขาวิทยาการคอมพิวเตอร์ (CSMJU2030 subsystem)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}
