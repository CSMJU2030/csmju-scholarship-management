import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination.dto';

export class ListScholarshipsQuery extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'รวมประกาศที่ปิดแล้ว (เฉพาะเจ้าหน้าที่)' })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' || value === '1' ? true : value === 'false' || value === '0' ? false : value))
  @IsBoolean()
  includeInactive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[A-Z0-9-]{2,40}$/)
  typeCode?: string;

  @ApiPropertyOptional({ description: 'ค้นจากชื่อทุน/เกณฑ์' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'เฉพาะทุนที่ปิดรับภายใน N วัน (ยังไม่หมดเขต)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(365)
  closingWithinDays?: number;
}
