import { ApiEnvelope } from '../common/api-envelope.decorator';
import { RequestDetailDto, RequestSummaryDto } from '../common/api-models';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { UserToken } from '../auth/decorators/user-token.decorator';
import { Permission } from '../auth/permissions';
import { ParseUuidV4Pipe } from '../common/parse-uuid-v4.pipe';
import { CreateRequestDto } from './dto/create-request.dto';
import { ListRequestsQuery } from './dto/list-requests.query';
import { UpdateRequestDto } from './dto/update-request.dto';
import { RequestsService } from './requests.service';

@ApiTags('requests')
@ApiBearerAuth()
@Controller('v1/requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @ApiOperation({ summary: 'รายการคำร้อง (นักศึกษาเห็นเฉพาะของตัวเอง · เจ้าหน้าที่เห็นทั้งหมด)' })
  @ApiEnvelope(RequestSummaryDto, { collection: true })
  @RequirePermissions(Permission.REQUEST_READ_OWN, Permission.REQUEST_READ_ANY)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListRequestsQuery) {
    return this.requests.list(user, query);
  }

  @ApiOperation({ summary: 'รายละเอียดคำร้อง พร้อมไฟล์แนบและประวัติสถานะ' })
  @ApiEnvelope(RequestDetailDto)
  @RequirePermissions(Permission.REQUEST_READ_OWN, Permission.REQUEST_READ_ANY)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @UserToken() token: string, @Param('id', ParseUuidV4Pipe) id: string) {
    return this.requests.findOne(user, id, token);
  }

  @ApiOperation({ summary: 'ยื่นใบสมัครทุน / คำร้องขอความช่วยเหลือฉุกเฉิน (นักศึกษา)' })
  @ApiEnvelope(RequestDetailDto, { status: HttpStatus.CREATED })
  @RequirePermissions(Permission.REQUEST_CREATE_OWN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @UserToken() token: string, @Body() dto: CreateRequestDto) {
    return this.requests.create(user, dto, token);
  }

  @ApiOperation({
    summary: 'เจ้าหน้าที่: เปลี่ยนสถานะ/บันทึกผลพิจารณา · เจ้าของ: แก้ไขหรือยกเลิกคำร้องที่ยังรอพิจารณา',
  })
  @ApiEnvelope(RequestDetailDto)
  @RequirePermissions(Permission.REQUEST_UPDATE_OWN, Permission.REQUEST_UPDATE_ANY)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidV4Pipe) id: string,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.requests.update(user, id, dto);
  }
}
