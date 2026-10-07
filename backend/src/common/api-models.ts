import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrorCode } from './error-codes';

export class PaginationMetaDto {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class ErrorDetailDto {
  @ApiProperty({ enum: Object.values(ErrorCode) }) code: string;
  @ApiProperty() message: string;
  @ApiPropertyOptional({ type: [String] }) details?: string[];
}

export class ErrorBodyDto {
  @ApiProperty({ enum: [false] }) success: false;
  @ApiProperty({ type: ErrorDetailDto }) error: ErrorDetailDto;
}

export class DeletedDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: [true] }) deleted: true;
}

export class PortalDto {
  @ApiProperty({ example: 'http://localhost:3100', description: 'เว็บพอร์ทัล CSMJU2030 (Core Hub)' }) url: string;
  @ApiProperty({ description: 'พอร์ทัลออนไลน์อยู่หรือไม่ (ตรวจทุก 30 วินาที)' }) reachable: boolean;
}

export class HealthDto {
  @ApiProperty({ enum: ['ok'] }) status: string;
  @ApiProperty({ example: 'csmju-scholarship' }) service: string;
  @ApiProperty({ type: PortalDto }) portal: PortalDto;
}

export class LookupItemDto {
  @ApiProperty() code: string;
  @ApiProperty() label: string;
  @ApiPropertyOptional({ enum: ['neutral', 'info', 'warning', 'success', 'danger'] }) tone?: string;
  @ApiPropertyOptional() isFinal?: boolean;
  @ApiProperty() sortOrder: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ format: 'date-time' }) updatedAt: string;
}

export class ScholarshipDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() title: string;
  @ApiProperty() typeCode: string;
  @ApiProperty() typeLabel: string;
  @ApiProperty({ description: 'สตางค์' }) amountMinSatang: number;
  @ApiProperty({ description: 'สตางค์' }) amountMaxSatang: number;
  @ApiProperty() amountNote: string;
  @ApiProperty({ example: '5,000 บาท / ภาคเรียน' }) amountLabel: string;
  @ApiProperty({ format: 'date', example: '2026-11-30' }) deadline: string;
  @ApiProperty({ description: 'จำนวนวันถึงวันปิดรับ (เวลาไทย) ติดลบ = เลยแล้ว' }) daysLeft: number;
  @ApiProperty() isExpired: boolean;
  @ApiProperty() isClosingSoon: boolean;
  @ApiProperty({ description: '0 = ไม่จำกัด' }) quota: number;
  @ApiProperty({ example: 2.5 }) minGpa: number;
  @ApiProperty() criteria: string;
  @ApiProperty() description: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() applicationCount: number;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
  @ApiProperty({ format: 'date-time' }) updatedAt: string;
}

/** ข้อมูลที่ผู้ยื่นแจ้งในคำร้อง — ไม่มีชื่อ/คณะ (ดูจาก Core Hub ตอนแสดงผล · standards 1.7.0) */
export class ApplicantDto {
  @ApiProperty({ type: String, nullable: true, description: 'รหัสนักศึกษาจาก Core Hub /people/me ตอนยื่น' }) personCode: string | null;
  @ApiProperty() contactPhone: string;
  @ApiProperty({ type: Number, nullable: true }) gpa: number | null;
  @ApiProperty({ type: Number, nullable: true }) age: number | null;
  @ApiProperty({ type: String, nullable: true }) nationality: string | null;
  @ApiPropertyOptional({ type: String, nullable: true, description: 'เฉพาะเจ้าหน้าที่' }) nationalId?: string | null;
}

/** บุคคลจาก Core Hub (ส่งต่อเพื่อแสดงผล ไม่เก็บในระบบนี้) */
export class PersonDto {
  @ApiProperty() personCode: string;
  @ApiProperty({ example: 'STUDENT' }) personType: string;
  @ApiProperty() fullNameTh: string;
  @ApiProperty({ type: String, nullable: true }) fullNameEn: string | null;
  @ApiProperty({ type: Number, nullable: true, description: 'ปี พ.ศ. ที่เข้าศึกษา' }) entryYear: number | null;
  @ApiProperty({ example: 'ACTIVE' }) status: string;
  @ApiProperty({ type: String, nullable: true }) facultyCode: string | null;
  @ApiProperty({ type: String, nullable: true }) facultyName: string | null;
  @ApiProperty({ type: String, nullable: true }) departmentCode: string | null;
  @ApiProperty({ type: String, nullable: true }) departmentName: string | null;
  @ApiProperty({ type: String, nullable: true }) curriculumName: string | null;
  @ApiProperty({ type: String, nullable: true }) universityEmail: string | null;
}

export class RequestSummaryDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ example: 'MJU-SCH-2026-0001' }) trackingNo: string;
  @ApiProperty({ enum: ['SCHOLARSHIP', 'WELFARE'] }) kind: 'SCHOLARSHIP' | 'WELFARE';
  @ApiProperty() coreUserId: string;
  @ApiProperty({ type: ApplicantDto }) applicant: ApplicantDto;
  @ApiProperty({ type: String, nullable: true }) scholarshipId: string | null;
  @ApiProperty({ type: String, nullable: true }) scholarshipTitle: string | null;
  @ApiProperty({ type: String, nullable: true }) issueCode: string | null;
  @ApiProperty({ type: String, nullable: true }) issueLabel: string | null;
  @ApiProperty({ type: String, nullable: true }) urgencyCode: string | null;
  @ApiProperty({ type: String, nullable: true }) urgencyLabel: string | null;
  @ApiProperty({ type: String, nullable: true }) urgencyTone: string | null;
  @ApiProperty({ type: Number, nullable: true }) familyIncomeSatang: number | null;
  @ApiProperty({ type: String, nullable: true }) familyStatusCode: string | null;
  @ApiProperty({ type: String, nullable: true }) familyStatusLabel: string | null;
  @ApiProperty({ type: String, nullable: true }) familyExpenses: string | null;
  @ApiProperty() amountRequestedSatang: number;
  @ApiProperty({ type: Number, nullable: true }) amountApprovedSatang: number | null;
  @ApiProperty() payoutCode: string;
  @ApiProperty() payoutLabel: string;
  @ApiProperty() payoutAccount: string;
  @ApiProperty() reason: string;
  @ApiProperty() statusCode: string;
  @ApiProperty() statusLabel: string;
  @ApiProperty() statusTone: string;
  @ApiProperty() isFinal: boolean;
  @ApiProperty() staffNote: string;
  @ApiProperty() attachmentCount: number;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
  @ApiProperty({ format: 'date-time' }) updatedAt: string;
}

export class AttachmentDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiPropertyOptional({ format: 'uuid' }) requestId?: string;
  @ApiProperty() originalName: string;
  @ApiProperty() mimeType: string;
  @ApiProperty() sizeBytes: number;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export class StatusHistoryDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ type: String, nullable: true }) fromStatusCode: string | null;
  @ApiProperty() toStatusCode: string;
  @ApiProperty() toStatusLabel: string;
  @ApiProperty() toStatusTone: string;
  @ApiProperty() note: string;
  @ApiProperty({ enum: ['STUDENT', 'STAFF', 'ADMIN'] }) changedByRole: string;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
}

export class RequestDetailDto extends RequestSummaryDto {
  @ApiProperty({ type: [AttachmentDto] }) attachments: AttachmentDto[];
  @ApiProperty({ type: [StatusHistoryDto] }) history: StatusHistoryDto[];
  @ApiProperty({ type: PersonDto, nullable: true, description: 'ชื่อผู้ยื่นจาก Core Hub — เฉพาะเจ้าหน้าที่ · หาไม่ได้ = null' })
  person: PersonDto | null;
}

export class StatusCountDto {
  @ApiProperty() code: string;
  @ApiProperty() label: string;
  @ApiProperty() tone: string;
  @ApiProperty() total: number;
}

export class MonthlyCountDto {
  @ApiProperty({ example: '2026-09' }) month: string;
  @ApiProperty({ example: 'ก.ย. 69' }) label: string;
  @ApiProperty() scholarship: number;
  @ApiProperty() welfare: number;
}

export class CodeCountDto {
  @ApiProperty() code: string;
  @ApiProperty() label: string;
  @ApiPropertyOptional() tone?: string;
  @ApiProperty() total: number;
}

export class TopScholarshipDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() title: string;
  @ApiProperty() quota: number;
  @ApiProperty() applicationCount: number;
  @ApiProperty() approvedCount: number;
}

export class RequestStatisticsDto {
  @ApiProperty({ type: [StatusCountDto] }) byStatus: StatusCountDto[];
  @ApiProperty({ description: 'คำร้องที่ยังไม่สิ้นสุด' }) awaitingActionCount: number;
  @ApiProperty({ description: 'รออาจารย์ที่ปรึกษาเกิน 7 วัน' }) overdueCount: number;
  @ApiProperty({ type: Number, nullable: true, description: 'อนุมัติ / (อนุมัติ + ไม่ผ่าน)' }) approvalRatePercent: number | null;
  @ApiProperty({ type: [MonthlyCountDto] }) monthly: MonthlyCountDto[];
  @ApiProperty({ type: [CodeCountDto] }) byIssueType: CodeCountDto[];
  @ApiProperty({ type: [CodeCountDto] }) openByUrgency: CodeCountDto[];
  @ApiProperty({ type: [TopScholarshipDto] }) topScholarships: TopScholarshipDto[];
  @ApiProperty() scholarshipRequestCount: number;
  @ApiProperty() welfareRequestCount: number;
  @ApiProperty() totalRequestedSatang: number;
  @ApiProperty() totalApprovedSatang: number;
  @ApiProperty() activeScholarshipCount: number;
}

export class LastApplicationDto {
  @ApiProperty() contactPhone: string;
  @ApiProperty() payoutCode: string;
  @ApiProperty() payoutAccount: string;
  @ApiProperty({ type: Number, nullable: true }) gpa: number | null;
  @ApiProperty({ type: Number, nullable: true }) age: number | null;
  @ApiProperty({ type: String, nullable: true }) nationality: string | null;
}

export class SessionDto {
  @ApiProperty({ format: 'date-time' }) expiresAt: string;
}

export class MeDto {
  @ApiProperty({ description: 'Core Hub user id (token.sub)' }) id: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: ['student', 'alumni', 'staff', 'lecturer', 'guest', 'admin'] }) coreRole: string;
  @ApiProperty({ enum: ['STUDENT', 'STAFF', 'ADMIN'] }) subsystemRole: string;
  @ApiProperty({ type: [String] }) permissions: string[];
  @ApiProperty({ type: SessionDto }) session: SessionDto;
  @ApiProperty({ type: PersonDto, nullable: true, description: 'จาก Core Hub /people/me' }) person: PersonDto | null;
  @ApiProperty({ enum: ['linked', 'unlinked', 'unavailable'] }) personStatus: string;
  @ApiProperty({ type: LastApplicationDto, nullable: true }) lastApplication: LastApplicationDto | null;
}
