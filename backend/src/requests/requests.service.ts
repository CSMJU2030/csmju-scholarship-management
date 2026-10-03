import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/core-hub-identity';
import { hasPermission, Permission } from '../auth/permissions';
import { conflict, forbidden, notFound, validationError } from '../common/api-exception';
import { fromGpa, formatBaht, toGpa } from '../common/money';
import { Paginated } from '../common/paginated';
import { Prisma } from '../generated/prisma/client';
import { LookupsService } from '../lookups/lookups.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScholarshipsService } from '../scholarships/scholarships.service';
import { PeopleService, toPersonView } from '../core-hub/people.service';
import type { CreateRequestDto } from './dto/create-request.dto';
import type { ListRequestsQuery } from './dto/list-requests.query';
import type { UpdateRequestDto } from './dto/update-request.dto';
import { nextTrackingNo } from './tracking-number';

const INITIAL_STATUS = 'PENDING_ADVISOR';
const CANCELLED_STATUS = 'CANCELLED';
/** สถานะที่มีวงเงินอนุมัติได้ — สถานะอื่น (รอ/ไม่ผ่าน/ยกเลิก) ล้างวงเงินอนุมัติเป็น null */
const AMOUNT_STATUSES = ['PRE_APPROVED', 'APPROVED'];
const STAFF_FIELDS = ['staffNote', 'amountApprovedSatang'] as const;
const OWNER_FIELDS = ['amountRequestedSatang', 'reason', 'payoutCode', 'payoutAccount', 'familyExpenses', 'urgencyCode'] as const;
const MAX_TRACKING_RETRIES = 3;

const SUMMARY_INCLUDE = {
  scholarship: { select: { title: true } },
  issueType: { select: { label: true } },
  urgencyLevel: { select: { label: true, tone: true } },
  familyStatus: { select: { label: true } },
  payoutMethod: { select: { label: true } },
  status: { select: { label: true, tone: true, isFinal: true } },
  _count: { select: { attachments: true } },
} as const;

const DETAIL_INCLUDE = {
  ...SUMMARY_INCLUDE,
  attachments: { orderBy: { createdAt: 'asc' as const } },
  history: {
    orderBy: { createdAt: 'asc' as const },
    include: { toStatus: { select: { label: true, tone: true } } },
  },
} as const;

type SummaryRow = Prisma.ApplicationRequestGetPayload<{ include: typeof SUMMARY_INCLUDE }>;
type DetailRow = Prisma.ApplicationRequestGetPayload<{ include: typeof DETAIL_INCLUDE }>;

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookups: LookupsService,
    private readonly scholarships: ScholarshipsService,
    private readonly people: PeopleService,
  ) {}

  // ------------------------------------------------------------------ views

  private summary(row: SummaryRow, user: AuthenticatedUser) {
    const staffView = hasPermission(user.permissions, Permission.REQUEST_READ_ANY);
    return {
      id: row.id,
      trackingNo: row.trackingNo,
      kind: row.kind,
      coreUserId: row.coreUserId,
      // ชื่อ/คณะของผู้ยื่นไม่เก็บในระบบนี้ — รายการแสดง personCode · รายละเอียดดึงชื่อจาก Core Hub ด้วย token ของผู้ดู
      applicant: {
        personCode: row.personCode,
        contactPhone: row.contactPhone,
        gpa: toGpa(row.gpaHundredths),
        age: row.age,
        nationality: row.nationality,
        ...(staffView ? { nationalId: row.nationalId } : {}),
      },
      scholarshipId: row.scholarshipId,
      scholarshipTitle: row.scholarship?.title ?? null,
      issueCode: row.issueCode,
      issueLabel: row.issueType?.label ?? null,
      urgencyCode: row.urgencyCode,
      urgencyLabel: row.urgencyLevel?.label ?? null,
      urgencyTone: row.urgencyLevel?.tone ?? null,
      familyIncomeSatang: row.familyIncomeSatang,
      familyStatusCode: row.familyStatusCode,
      familyStatusLabel: row.familyStatus?.label ?? null,
      familyExpenses: row.familyExpenses,
      amountRequestedSatang: row.amountRequestedSatang,
      amountApprovedSatang: row.amountApprovedSatang,
      payoutCode: row.payoutCode,
      payoutLabel: row.payoutMethod.label,
      payoutAccount: row.payoutAccount,
      reason: row.reason,
      statusCode: row.statusCode,
      statusLabel: row.status.label,
      statusTone: row.status.tone,
      isFinal: row.status.isFinal,
      staffNote: row.staffNote,
      attachmentCount: row._count.attachments,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private detail(row: DetailRow, user: AuthenticatedUser) {
    return {
      ...this.summary(row, user),
      attachments: row.attachments.map((file) => ({
        id: file.id,
        originalName: file.originalName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        createdAt: file.createdAt.toISOString(),
      })),
      history: row.history.map((entry) => ({
        id: entry.id,
        fromStatusCode: entry.fromStatusCode,
        toStatusCode: entry.toStatusCode,
        toStatusLabel: entry.toStatus.label,
        toStatusTone: entry.toStatus.tone,
        note: entry.note,
        changedByRole: entry.changedByRole,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }

  // ------------------------------------------------------------------ reads

  async list(user: AuthenticatedUser, query: ListRequestsQuery) {
    const where: Prisma.ApplicationRequestWhereInput = {};
    // ไม่มีสิทธิ์ :any → เห็นเฉพาะของตัวเอง (record.core_user_id === token.sub)
    if (!hasPermission(user.permissions, Permission.REQUEST_READ_ANY)) where.coreUserId = user.coreUserId;
    if (query.kind) where.kind = query.kind;
    if (query.statusCode) where.statusCode = query.statusCode;
    if (query.trackingNo) where.trackingNo = { equals: query.trackingNo, mode: 'insensitive' };
    if (query.q) {
      where.OR = [
        { trackingNo: { contains: query.q, mode: 'insensitive' } },
        { personCode: { contains: query.q, mode: 'insensitive' } },
        { scholarship: { title: { contains: query.q, mode: 'insensitive' } } },
        { issueType: { label: { contains: query.q, mode: 'insensitive' } } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.applicationRequest.count({ where }),
      this.prisma.applicationRequest.findMany({
        where,
        include: SUMMARY_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: query.skip,
        take: query.limit,
      }),
    ]);
    return new Paginated(rows.map((row) => this.summary(row, user)), total, query.page, query.limit);
  }

  /** ดึงแถวพร้อมตรวจ ownership — ไม่ใช่ของตัวเองและไม่มีสิทธิ์ :any → 403 (ไม่ใช่ 404) */
  async findAccessible(user: AuthenticatedUser, id: string, anyPermission: Permission): Promise<DetailRow> {
    const row = await this.prisma.applicationRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!row) throw notFound('ไม่พบคำร้องนี้');
    if (row.coreUserId !== user.coreUserId && !hasPermission(user.permissions, anyPermission)) {
      throw forbidden('คุณไม่มีสิทธิ์เข้าถึงคำร้องนี้');
    }
    return row;
  }

  async findOne(user: AuthenticatedUser, id: string, token?: string) {
    const detail = this.detail(await this.findAccessible(user, id, Permission.REQUEST_READ_ANY), user);
    // เจ้าหน้าที่ดูชื่อผู้ยื่นจาก Core Hub ตอนแสดงผล (ไม่ cache · ไม่เก็บ) — หาไม่ได้ให้หน้าเว็บแสดง personCode แทน
    let person = null;
    if (token && detail.applicant.personCode && detail.coreUserId !== user.coreUserId && hasPermission(user.permissions, Permission.REQUEST_READ_ANY)) {
      const found = await this.people.findForDisplay(detail.applicant.personCode, token);
      person = found ? toPersonView(found) : null;
    }
    return { ...detail, person };
  }

  // ------------------------------------------------------------------ create

  async create(user: AuthenticatedUser, dto: CreateRequestDto, token: string) {
    await this.lookups.assertActive('payoutMethod', dto.payoutCode, 'payoutCode');

    if (dto.kind === 'SCHOLARSHIP') {
      await this.lookups.assertActive('familyStatus', dto.familyStatusCode as string, 'familyStatusCode');
      const scholarship = this.scholarships.toView(
        await this.scholarships.findRow(dto.scholarshipId as string).catch(() => {
          throw validationError('scholarshipId does not exist');
        }),
      );
      if (scholarship.isExpired) throw conflict('ทุนการศึกษานี้ปิดรับสมัครแล้ว');
      if (dto.amountRequestedSatang > scholarship.amountMaxSatang) {
        throw validationError(`จำนวนเงินที่ขอรับต้องไม่เกิน ${formatBaht(scholarship.amountMaxSatang)} บาท`);
      }
      if (scholarship.minGpa > 0 && (dto.gpa ?? 0) < scholarship.minGpa) {
        throw validationError(`ทุนนี้กำหนดเกรดเฉลี่ยสะสมไม่ต่ำกว่า ${scholarship.minGpa.toFixed(2)}`);
      }
    } else {
      await this.lookups.assertActive('issueType', dto.issueCode as string, 'issueCode');
      await this.lookups.assertActive('urgencyLevel', dto.urgencyCode as string, 'urgencyCode');
    }

    // person_code จาก Core Hub ตอนเกิดรายการ (reference-data ข้อ 8) · บัญชีที่ยังไม่ผูกกับบุคคลได้ null
    const person = await this.people.me(token);
    const personCode = person?.personCode ?? null;
    const isScholarship = dto.kind === 'SCHOLARSHIP';

    for (let attempt = 1; ; attempt += 1) {
      try {
        const id = await this.prisma.$transaction(async (tx) => {
          if (dto.kind === 'SCHOLARSHIP') {
            // ยกเลิกแล้วสมัครใหม่ได้ — นับซ้ำเฉพาะใบที่ยังไม่ถูกยกเลิก
            const duplicate = await tx.applicationRequest.findFirst({
              where: { coreUserId: user.coreUserId, scholarshipId: dto.scholarshipId, statusCode: { not: CANCELLED_STATUS } },
              select: { trackingNo: true },
            });
            if (duplicate) throw conflict(`คุณได้ยื่นใบสมัครทุนนี้ไปแล้ว (รหัสติดตาม ${duplicate.trackingNo})`);
          }

          const created = await tx.applicationRequest.create({
            data: {
              trackingNo: await nextTrackingNo(tx, dto.kind),
              kind: dto.kind,
              coreUserId: user.coreUserId,
              personCode,
              contactPhone: dto.contactPhone,
              gpaHundredths: isScholarship && dto.gpa !== undefined ? fromGpa(dto.gpa) : null,
              age: isScholarship ? (dto.age ?? null) : null,
              nationality: isScholarship ? dto.nationality?.trim() || null : null,
              nationalId: isScholarship ? (dto.nationalId ?? null) : null,
              scholarshipId: dto.kind === 'SCHOLARSHIP' ? dto.scholarshipId : null,
              issueCode: dto.kind === 'WELFARE' ? dto.issueCode : null,
              urgencyCode: dto.kind === 'WELFARE' ? dto.urgencyCode : null,
              familyIncomeSatang: dto.kind === 'SCHOLARSHIP' ? dto.familyIncomeSatang : null,
              familyStatusCode: dto.kind === 'SCHOLARSHIP' ? dto.familyStatusCode : null,
              familyExpenses: dto.kind === 'SCHOLARSHIP' ? dto.familyExpenses?.trim() || null : null,
              amountRequestedSatang: dto.amountRequestedSatang,
              payoutCode: dto.payoutCode,
              payoutAccount: dto.payoutAccount,
              reason: dto.reason.trim(),
              statusCode: INITIAL_STATUS,
              history: {
                create: {
                  toStatusCode: INITIAL_STATUS,
                  note: dto.kind === 'SCHOLARSHIP' ? 'ยื่นใบสมัครเข้าระบบ' : 'ยื่นคำร้องเข้าระบบ',
                  changedByCoreUserId: user.coreUserId,
                  changedByRole: user.subsystemRole,
                },
              },
            },
            select: { id: true },
          });
          return created.id;
        });
        return this.findOne(user, id);
      } catch (error) {
        // เลขติดตามชนกัน (ยื่นพร้อมกัน) → ลองใหม่
        const isTrackingClash =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          JSON.stringify(error.meta ?? {}).includes('tracking_no');
        if (isTrackingClash && attempt < MAX_TRACKING_RETRIES) continue;
        throw error;
      }
    }
  }

  // ------------------------------------------------------------------ update

  async update(user: AuthenticatedUser, id: string, dto: UpdateRequestDto) {
    const current = await this.prisma.applicationRequest.findUnique({
      where: { id },
      select: {
        statusCode: true,
        coreUserId: true,
        kind: true,
        scholarship: { select: { amountMaxSatang: true } },
      },
    });
    if (!current) throw notFound('ไม่พบคำร้องนี้');

    if (hasPermission(user.permissions, Permission.REQUEST_UPDATE_ANY)) {
      const ownerFields = OWNER_FIELDS.filter((field) => dto[field] !== undefined);
      if (ownerFields.length > 0) throw forbidden('เจ้าหน้าที่แก้ไขรายละเอียดที่ผู้ยื่นกรอกไม่ได้');
      return this.staffUpdate(user, id, current.statusCode, dto);
    }
    // เจ้าของคำร้อง — ตรวจ ownership กับข้อมูลจริง (authorization.md ข้อ 4)
    if (current.coreUserId !== user.coreUserId) throw forbidden('คุณไม่มีสิทธิ์แก้ไขคำร้องนี้');
    if (STAFF_FIELDS.some((field) => dto[field] !== undefined)) throw forbidden('ช่องนี้แก้ไขได้เฉพาะเจ้าหน้าที่');
    return this.ownerUpdate(user, id, current, dto);
  }

  /** นักศึกษาแก้ไข / ยกเลิกคำร้องของตัวเองได้เฉพาะตอนที่ยังไม่มีใครเริ่มพิจารณา */
  private async ownerUpdate(
    user: AuthenticatedUser,
    id: string,
    current: { statusCode: string; kind: 'SCHOLARSHIP' | 'WELFARE'; scholarship: { amountMaxSatang: number } | null },
    dto: UpdateRequestDto,
  ) {
    if (current.statusCode === CANCELLED_STATUS) throw conflict('คำร้องนี้ถูกยกเลิกไปแล้ว');
    if (current.statusCode !== INITIAL_STATUS) {
      throw conflict('คำร้องนี้เข้าสู่การพิจารณาแล้ว แก้ไขหรือยกเลิกเองไม่ได้ กรุณาติดต่อเจ้าหน้าที่');
    }
    const note = (dto.changeNote ?? '').trim();

    if (dto.statusCode !== undefined) {
      if (dto.statusCode !== CANCELLED_STATUS) throw forbidden('ผู้ยื่นเปลี่ยนสถานะได้เฉพาะการยกเลิกคำร้อง');
      await this.prisma.$transaction([
        this.prisma.applicationRequest.update({ where: { id }, data: { statusCode: CANCELLED_STATUS } }),
        this.prisma.requestStatusHistory.create({
          data: {
            requestId: id,
            fromStatusCode: current.statusCode,
            toStatusCode: CANCELLED_STATUS,
            note: note || 'ผู้ยื่นยกเลิกคำร้อง',
            changedByCoreUserId: user.coreUserId,
            changedByRole: user.subsystemRole,
          },
        }),
      ]);
      return this.findOne(user, id);
    }

    const changed = OWNER_FIELDS.filter((field) => dto[field] !== undefined);
    if (changed.length === 0) return this.findOne(user, id);
    if (dto.payoutCode) await this.lookups.assertActive('payoutMethod', dto.payoutCode, 'payoutCode');
    if (dto.urgencyCode !== undefined) {
      if (current.kind !== 'WELFARE') throw validationError('urgencyCode ใช้ได้เฉพาะคำร้องฉุกเฉิน');
      await this.lookups.assertActive('urgencyLevel', dto.urgencyCode, 'urgencyCode');
    }
    if (dto.familyExpenses !== undefined && current.kind !== 'SCHOLARSHIP') {
      throw validationError('familyExpenses ใช้ได้เฉพาะใบสมัครทุน');
    }
    if (
      dto.amountRequestedSatang !== undefined &&
      current.scholarship &&
      dto.amountRequestedSatang > current.scholarship.amountMaxSatang
    ) {
      throw validationError(`จำนวนเงินที่ขอรับต้องไม่เกิน ${formatBaht(current.scholarship.amountMaxSatang)} บาท`);
    }

    await this.prisma.$transaction([
      this.prisma.applicationRequest.update({
        where: { id },
        data: {
          ...(dto.amountRequestedSatang !== undefined ? { amountRequestedSatang: dto.amountRequestedSatang } : {}),
          ...(dto.reason !== undefined ? { reason: dto.reason.trim() } : {}),
          ...(dto.payoutCode !== undefined ? { payoutCode: dto.payoutCode } : {}),
          ...(dto.payoutAccount !== undefined ? { payoutAccount: dto.payoutAccount } : {}),
          ...(dto.familyExpenses !== undefined ? { familyExpenses: dto.familyExpenses.trim() || null } : {}),
          ...(dto.urgencyCode !== undefined ? { urgencyCode: dto.urgencyCode } : {}),
        },
      }),
      this.prisma.requestStatusHistory.create({
        data: {
          requestId: id,
          fromStatusCode: current.statusCode,
          toStatusCode: current.statusCode,
          note: note || 'ผู้ยื่นแก้ไขรายละเอียดคำร้อง',
          changedByCoreUserId: user.coreUserId,
          changedByRole: user.subsystemRole,
        },
      }),
    ]);
    return this.findOne(user, id);
  }

  private async staffUpdate(user: AuthenticatedUser, id: string, currentStatus: string, dto: UpdateRequestDto) {
    const statusCode = dto.statusCode ?? currentStatus;
    if (dto.statusCode) await this.lookups.assertActive('requestStatus', dto.statusCode, 'statusCode');

    const note = (dto.staffNote ?? '').trim();
    const allowsAmount = AMOUNT_STATUSES.includes(statusCode);
    if (dto.amountApprovedSatang !== undefined && !allowsAmount) {
      throw validationError('ระบุวงเงินที่อนุมัติได้เฉพาะสถานะ "อนุมัติขั้นต้น" หรือ "อนุมัติ" เท่านั้น');
    }
    if (statusCode === 'REJECTED' && statusCode !== currentStatus && note.length < 5) {
      throw validationError('กรุณาระบุเหตุผลที่ไม่อนุมัติ (อย่างน้อย 5 ตัวอักษร) เพื่อแจ้งผู้ยื่น');
    }
    if (statusCode === currentStatus && !note && dto.amountApprovedSatang === undefined) {
      return this.findOne(user, id);
    }

    await this.prisma.$transaction([
      this.prisma.applicationRequest.update({
        where: { id },
        data: {
          statusCode,
          ...(dto.staffNote !== undefined ? { staffNote: note } : {}),
          ...(!allowsAmount
            ? { amountApprovedSatang: null }
            : dto.amountApprovedSatang !== undefined
              ? { amountApprovedSatang: dto.amountApprovedSatang }
              : {}),
        },
      }),
      this.prisma.requestStatusHistory.create({
        data: {
          requestId: id,
          fromStatusCode: currentStatus,
          toStatusCode: statusCode,
          note,
          changedByCoreUserId: user.coreUserId,
          changedByRole: user.subsystemRole,
        },
      }),
    ]);
    return this.findOne(user, id);
  }
}
