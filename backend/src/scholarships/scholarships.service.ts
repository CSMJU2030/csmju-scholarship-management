import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/core-hub-identity';
import { hasPermission, Permission } from '../auth/permissions';
import { conflict, notFound, validationError } from '../common/api-exception';
import { daysUntil, parseIsoDate, todayInBangkok, toIsoDate } from '../common/dates';
import { formatBaht, fromGpa, toGpa } from '../common/money';
import { Paginated } from '../common/paginated';
import type { Prisma } from '../generated/prisma/client';
import { LookupsService } from '../lookups/lookups.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateScholarshipDto } from './dto/create-scholarship.dto';
import type { ListScholarshipsQuery } from './dto/list-scholarships.query';
import type { UpdateScholarshipDto } from './dto/update-scholarship.dto';

const INCLUDE = {
  type: { select: { label: true } },
  _count: { select: { requests: true } },
} as const;

type ScholarshipRow = Prisma.ScholarshipGetPayload<{ include: typeof INCLUDE }>;

export interface ScholarshipView {
  id: string;
  title: string;
  typeCode: string;
  typeLabel: string;
  amountMinSatang: number;
  amountMaxSatang: number;
  amountNote: string;
  amountLabel: string;
  deadline: string;
  daysLeft: number;
  isExpired: boolean;
  isClosingSoon: boolean;
  quota: number;
  minGpa: number;
  criteria: string;
  description: string;
  isActive: boolean;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ScholarshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookups: LookupsService,
  ) {}

  toView(row: ScholarshipRow): ScholarshipView {
    const daysLeft = daysUntil(row.deadline);
    const min = formatBaht(row.amountMinSatang);
    const max = formatBaht(row.amountMaxSatang);
    const range = row.amountMinSatang === row.amountMaxSatang ? `${max} บาท` : `${min} - ${max} บาท`;
    return {
      id: row.id,
      title: row.title,
      typeCode: row.typeCode,
      typeLabel: row.type.label,
      amountMinSatang: row.amountMinSatang,
      amountMaxSatang: row.amountMaxSatang,
      amountNote: row.amountNote,
      amountLabel: `${range} ${row.amountNote}`.trim(),
      deadline: toIsoDate(row.deadline),
      daysLeft,
      isExpired: daysLeft < 0 || !row.isActive,
      isClosingSoon: row.isActive && daysLeft >= 0 && daysLeft <= 7,
      quota: row.quota,
      minGpa: toGpa(row.minGpaHundredths) ?? 0,
      criteria: row.criteria,
      description: row.description,
      isActive: row.isActive,
      applicationCount: row._count.requests,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async list(user: AuthenticatedUser, query: ListScholarshipsQuery): Promise<Paginated<ScholarshipView>> {
    const canSeeInactive = hasPermission(user.permissions, Permission.SCHOLARSHIP_UPDATE);
    const where: Prisma.ScholarshipWhereInput = {};
    if (!(query.includeInactive && canSeeInactive)) where.isActive = true;
    if (query.typeCode) where.typeCode = query.typeCode;
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { criteria: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.closingWithinDays !== undefined) {
      const today = parseIsoDate(todayInBangkok());
      const until = new Date(today.getTime() + query.closingWithinDays * 86_400_000);
      where.deadline = { gte: today, lte: until };
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.scholarship.count({ where }),
      this.prisma.scholarship.findMany({
        where,
        include: INCLUDE,
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
        skip: query.skip,
        take: query.limit,
      }),
    ]);
    return new Paginated(rows.map((row) => this.toView(row)), total, query.page, query.limit);
  }

  async findRow(id: string): Promise<ScholarshipRow> {
    const row = await this.prisma.scholarship.findUnique({ where: { id }, include: INCLUDE });
    if (!row) throw notFound('ไม่พบประกาศทุนการศึกษานี้');
    return row;
  }

  async findOne(user: AuthenticatedUser, id: string): Promise<ScholarshipView> {
    const row = await this.findRow(id);
    if (!row.isActive && !hasPermission(user.permissions, Permission.SCHOLARSHIP_UPDATE)) {
      throw notFound('ไม่พบประกาศทุนการศึกษานี้');
    }
    return this.toView(row);
  }

  async create(user: AuthenticatedUser, dto: CreateScholarshipDto): Promise<ScholarshipView> {
    await this.lookups.assertActive('scholarshipType', dto.typeCode, 'typeCode');
    this.assertAmounts(dto.amountMinSatang, dto.amountMaxSatang);
    const row = await this.prisma.scholarship.create({
      data: {
        title: dto.title.trim(),
        typeCode: dto.typeCode,
        amountMinSatang: dto.amountMinSatang,
        amountMaxSatang: dto.amountMaxSatang,
        amountNote: (dto.amountNote ?? '').trim(),
        deadline: this.parseDeadline(dto.deadline),
        quota: dto.quota ?? 0,
        minGpaHundredths: fromGpa(dto.minGpa ?? 0),
        criteria: dto.criteria.trim(),
        description: dto.description.trim(),
        isActive: dto.isActive ?? true,
        createdByCoreUserId: user.coreUserId,
      },
      include: INCLUDE,
    });
    return this.toView(row);
  }

  async update(id: string, dto: UpdateScholarshipDto): Promise<ScholarshipView> {
    const current = await this.findRow(id);
    if (dto.typeCode) await this.lookups.assertActive('scholarshipType', dto.typeCode, 'typeCode');
    this.assertAmounts(dto.amountMinSatang ?? current.amountMinSatang, dto.amountMaxSatang ?? current.amountMaxSatang);
    const row = await this.prisma.scholarship.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.typeCode !== undefined ? { typeCode: dto.typeCode } : {}),
        ...(dto.amountMinSatang !== undefined ? { amountMinSatang: dto.amountMinSatang } : {}),
        ...(dto.amountMaxSatang !== undefined ? { amountMaxSatang: dto.amountMaxSatang } : {}),
        ...(dto.amountNote !== undefined ? { amountNote: dto.amountNote.trim() } : {}),
        ...(dto.deadline !== undefined ? { deadline: this.parseDeadline(dto.deadline) } : {}),
        ...(dto.quota !== undefined ? { quota: dto.quota } : {}),
        ...(dto.minGpa !== undefined ? { minGpaHundredths: fromGpa(dto.minGpa) } : {}),
        ...(dto.criteria !== undefined ? { criteria: dto.criteria.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: INCLUDE,
    });
    return this.toView(row);
  }

  /** มีใบสมัครแล้วห้ามลบ ให้ปิดประกาศด้วย PATCH isActive=false แทน เพื่อเก็บประวัติ */
  async remove(id: string): Promise<{ id: string; deleted: true }> {
    const row = await this.findRow(id);
    if (row._count.requests > 0) {
      throw conflict(`ทุนนี้มีใบสมัครแล้ว ${row._count.requests} ใบ ลบไม่ได้ ให้ปิดประกาศแทน`);
    }
    await this.prisma.scholarship.delete({ where: { id } });
    return { id, deleted: true };
  }

  private assertAmounts(min: number, max: number): void {
    if (min > max) {
      throw validationError('amountMinSatang must not exceed amountMaxSatang');
    }
  }

  private parseDeadline(value: string): Date {
    const date = parseIsoDate(value);
    if (Number.isNaN(date.getTime()) || toIsoDate(date) !== value) {
      throw validationError('deadline must be a real calendar date (YYYY-MM-DD)');
    }
    return date;
  }
}
