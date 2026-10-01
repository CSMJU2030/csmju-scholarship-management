import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { ApiEnvelope } from '../common/api-envelope.decorator';
import { HealthDto } from '../common/api-models';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PortalStatusService } from './portal-status.service';

/** GET /api/health — public · data.service ต้องตรงกับ name ใน subsystem.yaml (api-conventions.md ข้อ 8) */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly portal: PortalStatusService,
  ) {}

  @ApiOperation({ summary: 'health check + สถานะพอร์ทัล CSMJU2030' })
  @ApiEnvelope(HealthDto)
  @Public()
  @Get()
  async check() {
    return {
      status: 'ok',
      service: this.config.subsystemName,
      portal: { url: this.portal.webUrl, reachable: await this.portal.reachable() },
    };
  }
}
