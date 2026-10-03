import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export const REQUEST_KINDS = ['SCHOLARSHIP', 'WELFARE'] as const;
export type RequestKindValue = (typeof REQUEST_KINDS)[number];

const CODE = /^[A-Z0-9-]{2,40}$/;

/**
 * ยื่นคำร้องใหม่ — kind = SCHOLARSHIP (สมัครทุน) หรือ WELFARE (ขอความช่วยเหลือฉุกเฉิน)
 * เงินทุกช่องเป็นจำนวนเต็มหน่วยสตางค์ · ตัวตนผู้ยื่นมาจาก token เท่านั้น
 */
export class CreateRequestDto {
  @ApiProperty({ enum: REQUEST_KINDS })
  @IsIn(REQUEST_KINDS)
  kind: RequestKindValue;

  // ชื่อ รหัสนักศึกษา คณะ สาขา ไม่รับจาก body — มาจาก Core Hub (/people/me) ตามตัวตนใน token (standards 1.7.0)

  @ApiProperty({ description: 'เบอร์ติดต่อกลับสำหรับคำร้องนี้ 10 หลัก ไม่มีขีด', example: '0812345678' })
  @Matches(/^\d{10}$/, { message: 'contactPhone must be 10 digits without hyphen' })
  contactPhone: string;

  @ApiProperty({ example: 'PROMPTPAY' })
  @Matches(CODE)
  payoutCode: string;

  @ApiProperty({ example: '0812345678' })
  @Matches(/^[0-9-]{6,20}$/, { message: 'payoutAccount must be 6-20 digits' })
  payoutAccount: string;

  @ApiProperty({ description: 'จำนวนเงินที่ขอรับ (สตางค์)', example: 500000 })
  @IsInt()
  @Min(100)
  @Max(100_000_000)
  amountRequestedSatang: number;

  @ApiProperty({ minLength: 20, maxLength: 2000 })
  @IsString()
  @Length(20, 2000)
  reason: string;

  // ---------- เฉพาะใบสมัครทุน ----------

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((o: CreateRequestDto) => o.kind === 'SCHOLARSHIP')
  @IsUUID('4')
  scholarshipId?: string;

  @ApiPropertyOptional({ description: 'เลขบัตรประชาชน 13 หลัก' })
  @ValidateIf((o: CreateRequestDto) => o.kind === 'SCHOLARSHIP')
  @Matches(/^\d{13}$/, { message: 'nationalId must be 13 digits' })
  nationalId?: string;

  @ApiPropertyOptional({ example: 3.25 })
  @ValidateIf((o: CreateRequestDto) => o.kind === 'SCHOLARSHIP')
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  gpa?: number;

  @ApiPropertyOptional({ example: 20 })
  @ValidateIf((o: CreateRequestDto) => o.kind === 'SCHOLARSHIP')
  @IsInt()
  @Min(15)
  @Max(99)
  age?: number;

  @ApiPropertyOptional({ example: 'ไทย' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  nationality?: string;

  @ApiPropertyOptional({ description: 'รายได้ครอบครัวต่อปี (สตางค์)' })
  @ValidateIf((o: CreateRequestDto) => o.kind === 'SCHOLARSHIP')
  @IsInt()
  @Min(0)
  @Max(10_000_000_000)
  familyIncomeSatang?: number;

  @ApiPropertyOptional({ example: 'TOGETHER' })
  @ValidateIf((o: CreateRequestDto) => o.kind === 'SCHOLARSHIP')
  @Matches(CODE)
  familyStatusCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  familyExpenses?: string;

  // ---------- เฉพาะคำร้องฉุกเฉิน ----------

  @ApiPropertyOptional({ example: 'MEDICAL' })
  @ValidateIf((o: CreateRequestDto) => o.kind === 'WELFARE')
  @Matches(CODE)
  issueCode?: string;

  @ApiPropertyOptional({ example: 'URGENT' })
  @ValidateIf((o: CreateRequestDto) => o.kind === 'WELFARE')
  @Matches(CODE)
  urgencyCode?: string;

  @ApiPropertyOptional({ description: 'ต้องเป็น true — รับรองว่าข้อมูลเป็นความจริง' })
  @ValidateIf((o: CreateRequestDto) => o.kind === 'WELFARE')
  @Equals(true, { message: 'acceptTerms must be accepted' })
  acceptTerms?: boolean;
}
