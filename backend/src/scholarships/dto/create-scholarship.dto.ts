import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** เงินทุกช่องเป็นจำนวนเต็มหน่วยสตางค์ (1 บาท = 100 สตางค์) */
export class CreateScholarshipDto {
  @ApiProperty({ example: 'ทุนสนับสนุนการศึกษา สาขาวิทยาการคอมพิวเตอร์ ภาคเรียนที่ 2/2569' })
  @IsString()
  @Length(5, 200)
  title: string;

  @ApiProperty({ example: 'DEPARTMENT' })
  @IsString()
  @Matches(/^[A-Z0-9-]{2,40}$/)
  typeCode: string;

  @ApiProperty({ description: 'วงเงินขั้นต่ำ (สตางค์)', example: 500000 })
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  amountMinSatang: number;

  @ApiProperty({ description: 'วงเงินสูงสุด (สตางค์)', example: 500000 })
  @IsInt()
  @Min(100)
  @Max(100_000_000)
  amountMaxSatang: number;

  @ApiPropertyOptional({ example: '/ ภาคเรียน' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  amountNote?: string;

  @ApiProperty({ description: 'วันปิดรับสมัคร YYYY-MM-DD', example: '2026-11-30' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'deadline must be YYYY-MM-DD' })
  deadline: string;

  @ApiPropertyOptional({ description: 'จำนวนทุน (0 = ไม่จำกัด)', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  quota?: number;

  @ApiPropertyOptional({ description: 'เกรดเฉลี่ยขั้นต่ำ 0.00–4.00', example: 2.5 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  minGpa?: number;

  @ApiProperty()
  @IsString()
  @Length(5, 500)
  criteria: string;

  @ApiProperty()
  @IsString()
  @Length(5, 1000)
  description: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
