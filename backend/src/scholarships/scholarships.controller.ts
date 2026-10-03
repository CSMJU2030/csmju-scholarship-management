import { ApiEnvelope } from '../common/api-envelope.decorator';
import { DeletedDto, ScholarshipDto } from '../common/api-models';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { Paginated } from '../common/paginated';
import { ParseUuidV4Pipe } from '../common/parse-uuid-v4.pipe';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { ListScholarshipsQuery } from './dto/list-scholarships.query';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { ScholarshipsService, type ScholarshipView } from './scholarships.service';

@ApiTags('scholarships')
@ApiBearerAuth()
@Controller('v1/scholarships')
export class ScholarshipsController {
  constructor(private readonly scholarships: ScholarshipsService) {}

  @ApiOperation({ summary: 'รายการประกาศทุน' })
  @ApiEnvelope(ScholarshipDto, { collection: true })
  @RequirePermissions(Permission.SCHOLARSHIP_READ)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListScholarshipsQuery): Promise<Paginated<ScholarshipView>> {
    return this.scholarships.list(user, query);
  }

  @ApiOperation({ summary: 'รายละเอียดประกาศทุน' })
  @ApiEnvelope(ScholarshipDto)
  @RequirePermissions(Permission.SCHOLARSHIP_READ)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUuidV4Pipe) id: string): Promise<ScholarshipView> {
    return this.scholarships.findOne(user, id);
  }

  @ApiOperation({ summary: 'สร้างประกาศทุน (เจ้าหน้าที่)' })
  @ApiEnvelope(ScholarshipDto, { status: HttpStatus.CREATED })
  @RequirePermissions(Permission.SCHOLARSHIP_CREATE)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateScholarshipDto): Promise<ScholarshipView> {
    return this.scholarships.create(user, dto);
  }

  @ApiOperation({ summary: 'แก้ไข / เปิด-ปิดประกาศทุน (เจ้าหน้าที่)' })
  @ApiEnvelope(ScholarshipDto)
  @RequirePermissions(Permission.SCHOLARSHIP_UPDATE)
  @Patch(':id')
  update(@Param('id', ParseUuidV4Pipe) id: string, @Body() dto: UpdateScholarshipDto): Promise<ScholarshipView> {
    return this.scholarships.update(id, dto);
  }

  @ApiOperation({ summary: 'ลบประกาศทุนที่ยังไม่มีใบสมัคร (ผู้ดูแลระบบ)' })
  @ApiEnvelope(DeletedDto)
  @RequirePermissions(Permission.SCHOLARSHIP_DELETE)
  @Delete(':id')
  remove(@Param('id', ParseUuidV4Pipe) id: string): Promise<{ id: string; deleted: true }> {
    return this.scholarships.remove(id);
  }
}
