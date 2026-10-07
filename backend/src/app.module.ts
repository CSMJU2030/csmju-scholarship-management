import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AttachmentsModule } from './attachments/attachments.module';
import { AuthModule } from './auth/auth.module';
import { CoreHubJwtGuard } from './auth/guards/core-hub-jwt.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { ResponseEnvelopeInterceptor } from './common/response-envelope.interceptor';
import { AppConfigModule } from './config/config.module';
import { HealthController } from './health/health.controller';
import { PortalStatusService } from './health/portal-status.service';
import { LookupsModule } from './lookups/lookups.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './requests/requests.module';
import { ScholarshipsModule } from './scholarships/scholarships.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuthModule,
    LookupsModule,
    ScholarshipsModule,
    RequestsModule,
    AttachmentsModule,
    StatisticsModule,
  ],
  controllers: [HealthController],
  providers: [
    PortalStatusService,
    // ทุก route ต้องมี token (401) แล้วจึงตรวจสิทธิ์ (403) — ยกเว้นที่ติด @Public()
    { provide: APP_GUARD, useClass: CoreHubJwtGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
