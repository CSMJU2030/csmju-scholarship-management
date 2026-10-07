import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination.dto';
import { REQUEST_KINDS, type RequestKindValue } from './create-request.dto';

export class ListRequestsQuery extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: REQUEST_KINDS })
  @IsOptional()
  @IsIn(REQUEST_KINDS)
  kind?: RequestKindValue;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[A-Z0-9_-]{2,40}$/)
  statusCode?: string;

  @ApiPropertyOptional({ description: 'รหัสติดตามคำร้อง เช่น MJU-SCH-2026-0001' })
  @IsOptional()
  @Matches(/^[A-Za-z0-9-]{4,30}$/)
  trackingNo?: string;

  @ApiPropertyOptional({ description: 'ค้นจากชื่อ รหัสนักศึกษา รหัสติดตาม หรือชื่อทุน' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
