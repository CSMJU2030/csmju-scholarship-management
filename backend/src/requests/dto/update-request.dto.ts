import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Matches, Max, MaxLength, Min } from 'class-validator';

/**
 * PATCH /api/v1/requests/:id
 *  - เจ้าหน้าที่ (request:update:any): เปลี่ยนสถานะ · หมายเหตุ · วงเงินที่อนุมัติ
 *  - เจ้าของคำร้อง (request:update:own): แก้รายละเอียด หรือยกเลิก (statusCode = CANCELLED)
 *    ได้เฉพาะตอนสถานะยังเป็น PENDING_ADVISOR
 * ทุกการเปลี่ยนแปลงถูกบันทึกลงประวัติ
 */
export class UpdateRequestDto {
  // ---------- ใช้ได้ทั้งสองฝ่าย (เจ้าของใช้ได้เฉพาะค่า CANCELLED)
  @ApiPropertyOptional({ example: 'UNDER_REVIEW' })
  @IsOptional()
  @Matches(/^[A-Z0-9_-]{2,40}$/)
  statusCode?: string;

  // ---------- เฉพาะเจ้าหน้าที่
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  staffNote?: string;

  @ApiPropertyOptional({ description: 'วงเงินที่อนุมัติ (สตางค์)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  amountApprovedSatang?: number;

  // ---------- เฉพาะเจ้าของคำร้อง
  @ApiPropertyOptional({ description: 'จำนวนเงินที่ขอรับ (สตางค์)' })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(100_000_000)
  amountRequestedSatang?: number;

  @ApiPropertyOptional({ minLength: 20, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @Length(20, 2000)
  reason?: string;

  @ApiPropertyOptional({ example: 'PROMPTPAY' })
  @IsOptional()
  @Matches(/^[A-Z0-9-]{2,40}$/)
  payoutCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[0-9-]{6,20}$/, { message: 'payoutAccount must be 6-20 digits' })
  payoutAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  familyExpenses?: string;

  @ApiPropertyOptional({ example: 'URGENT' })
  @IsOptional()
  @Matches(/^[A-Z0-9-]{2,40}$/)
  urgencyCode?: string;

  @ApiPropertyOptional({ maxLength: 500, description: 'เหตุผลที่ยกเลิก/แก้ไข (บันทึกลงประวัติ)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  changeNote?: string;
}
