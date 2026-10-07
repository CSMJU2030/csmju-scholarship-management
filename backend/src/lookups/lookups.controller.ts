import { ApiEnvelope } from '../common/api-envelope.decorator';
import { LookupItemDto } from '../common/api-models';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { Paginated } from '../common/paginated';
import { LookupsService, type LookupItem } from './lookups.service';

/** ข้อมูลอ้างอิงภายในระบบ — response ไม่มี id ใช้ code เป็นตัวอ้าง (reference-data.md ข้อ 1) */
@ApiTags('reference-data')
@ApiBearerAuth()
@RequirePermissions(Permission.REFERENCE_READ)
@Controller('v1')
export class LookupsController {
  constructor(private readonly lookups: LookupsService) {}

  @ApiOperation({ summary: 'สถานะคำร้อง' })
  @ApiEnvelope(LookupItemDto, { collection: true })
  @Get('request-statuses')
  requestStatuses(): Promise<Paginated<LookupItem>> {
    return this.lookups.list('requestStatus');
  }

  @ApiOperation({ summary: 'ระดับความเร่งด่วน' })
  @ApiEnvelope(LookupItemDto, { collection: true })
  @Get('urgency-levels')
  urgencyLevels(): Promise<Paginated<LookupItem>> {
    return this.lookups.list('urgencyLevel');
  }

  @ApiOperation({ summary: 'ประเภททุน' })
  @ApiEnvelope(LookupItemDto, { collection: true })
  @Get('scholarship-types')
  scholarshipTypes(): Promise<Paginated<LookupItem>> {
    return this.lookups.list('scholarshipType');
  }

  @ApiOperation({ summary: 'ประเภทความเดือดร้อน' })
  @ApiEnvelope(LookupItemDto, { collection: true })
  @Get('issue-types')
  issueTypes(): Promise<Paginated<LookupItem>> {
    return this.lookups.list('issueType');
  }

  @ApiOperation({ summary: 'สถานภาพครอบครัว' })
  @ApiEnvelope(LookupItemDto, { collection: true })
  @Get('family-statuses')
  familyStatuses(): Promise<Paginated<LookupItem>> {
    return this.lookups.list('familyStatus');
  }

  @ApiOperation({ summary: 'ช่องทางรับเงิน' })
  @ApiEnvelope(LookupItemDto, { collection: true })
  @Get('payout-methods')
  payoutMethods(): Promise<Paginated<LookupItem>> {
    return this.lookups.list('payoutMethod');
  }
}
