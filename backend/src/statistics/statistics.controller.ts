import { ApiEnvelope } from '../common/api-envelope.decorator';
import { RequestStatisticsDto } from '../common/api-models';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { StatisticsService } from './statistics.service';

@ApiTags('statistics')
@ApiBearerAuth()
@Controller('v1/request-statistics')
export class StatisticsController {
  constructor(private readonly statistics: StatisticsService) {}

  @ApiOperation({ summary: 'สรุปภาพรวมคำร้องสำหรับหน้าเจ้าหน้าที่' })
  @ApiEnvelope(RequestStatisticsDto)
  @RequirePermissions(Permission.STATISTICS_READ)
  @Get()
  summary() {
    return this.statistics.summary();
  }
}
