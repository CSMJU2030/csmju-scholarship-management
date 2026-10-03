import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildOpenApi, configureApp, OUTSIDE_API_PREFIX } from './app.setup';
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
  new Logger('Bootstrap').log(`${config.subsystemName} backend listening on :${config.port}`);
}

void bootstrap();
