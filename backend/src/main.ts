import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildOpenApi, configureApp, OUTSIDE_API_PREFIX } from './app.setup';
import { JWT_CONTRACT } from './auth/jwt-contract';
import { APP_CONFIG, type AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);

  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.setGlobalPrefix('api', { exclude: OUTSIDE_API_PREFIX });
  configureApp(app);

  if (config.corsOrigins.length > 0) {
    app.enableCors({ origin: config.corsOrigins, credentials: true });
  }
  if (config.nodeEnv !== 'production') {
    SwaggerModule.setup('api/docs', app, buildOpenApi(app));
  }
  app.enableShutdownHooks();

  await app.listen(config.port);
  // logging.md ข้อ 1 — docker compose logs api ต้องเห็น event นี้ (deployment.md ข้อ 6)
  new Logger('Bootstrap').log(
    JSON.stringify({
      event: 'subsystem.started',
      subsystem: config.subsystemName,
      port: config.port,
      coreHubUrl: config.coreHubUrl,
      jwksUrl: `${config.coreHubUrl}${JWT_CONTRACT.jwksPath}`,
      issuer: JWT_CONTRACT.issuer,
      audience: JWT_CONTRACT.audience,
    }),
  );
}

void bootstrap();
