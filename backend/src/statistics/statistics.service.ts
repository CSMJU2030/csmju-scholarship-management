import { Injectable } from '@nestjs/common';
import { parseIsoDate, todayInBangkok } from '../common/dates';
import { PrismaService } from '../prisma/prisma.service';

const MONTHS = 6;
const OVERDUE_DAYS = 7;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** YYYY-MM ตามเวลาไทย */
const monthKey = (date: Date) => new Date(date.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 7);

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const monthKeys: string[] = [];
    const cursor = new Date(Date.UTC(Number(todayInBangkok(now).slice(0, 4)), Number(todayInBangkok(now).slice(5, 7)) - 1, 1));
    for (let i = MONTHS - 1; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
      monthKeys.push(d.toISOString().slice(0, 7));
    }
    const since = new Date(Date.parse(`${monthKeys[0]}-01T00:00:00+07:00`));
    const overdueBefore = new Date(now.getTime() - OVERDUE_DAYS * 86_400_000);

    const [
      statuses,
      byStatus,
      byKind,
      requested,
      approved,
      activeScholarships,
      recent,
      issueTypes,
      byIssue,
      urgencyLevels,
      openByUrgency,
      topScholarships,
      overdue,
    ] = await Promise.all([
      this.prisma.requestStatus.findMany({ orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] }),
      this.prisma.applicationRequest.groupBy({ by: ['statusCode'], _count: { _all: true } }),
      this.prisma.applicationRequest.groupBy({ by: ['kind'], _count: { _all: true } }),
      this.prisma.applicationRequest.aggregate({
        _sum: { amountRequestedSatang: true },
        where: { statusCode: { not: 'CANCELLED' } },
      }),
      this.prisma.applicationRequest.findMany({
        where: { statusCode: 'APPROVED' },
        select: { amountApprovedSatang: true, amountRequestedSatang: true },
      }),
      this.prisma.scholarship.count({ where: { isActive: true, deadline: { gte: parseIsoDate(todayInBangkok()) } } }),
      this.prisma.applicationRequest.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, kind: true } }),
      this.prisma.issueType.findMany({ orderBy: [{ sortOrder: 'asc' }] }),
      this.prisma.applicationRequest.groupBy({ by: ['issueCode'], where: { kind: 'WELFARE' }, _count: { _all: true } }),
      this.prisma.urgencyLevel.findMany({ orderBy: [{ sortOrder: 'asc' }] }),
      this.prisma.applicationRequest.groupBy({
        by: ['urgencyCode'],
        where: { kind: 'WELFARE', status: { isFinal: false } },
        _count: { _all: true },
      }),
      this.prisma.scholarship.findMany({
        where: { requests: { some: {} } },
        select: {
          id: true,
          title: true,
          quota: true,
          _count: { select: { requests: true } },
          requests: { where: { statusCode: 'APPROVED' }, select: { id: true } },
        },
        orderBy: { requests: { _count: 'desc' } },
        take: 5,
      }),
      this.prisma.applicationRequest.count({ where: { statusCode: 'PENDING_ADVISOR', createdAt: { lt: overdueBefore } } }),
    ]);

    const countOf = (code: string) => byStatus.find((row) => row.statusCode === code)?._count._all ?? 0;
    const kindCount = (kind: 'SCHOLARSHIP' | 'WELFARE') => byKind.find((row) => row.kind === kind)?._count._all ?? 0;
    const approvedCount = countOf('APPROVED');
    const rejectedCount = countOf('REJECTED');
    const decided = approvedCount + rejectedCount;

    return {
      byStatus: statuses.map((status) => ({
        code: status.code,
        label: status.label,
        tone: status.tone,
        total: countOf(status.code),
      })),
      scholarshipRequestCount: kindCount('SCHOLARSHIP'),
      welfareRequestCount: kindCount('WELFARE'),
      totalRequestedSatang: requested._sum.amountRequestedSatang ?? 0,
      totalApprovedSatang: approved.reduce((sum, row) => sum + (row.amountApprovedSatang ?? row.amountRequestedSatang), 0),
      activeScholarshipCount: activeScholarships,
      awaitingActionCount: statuses.filter((s) => !s.isFinal).reduce((sum, s) => sum + countOf(s.code), 0),
      overdueCount: overdue,
      approvalRatePercent: decided > 0 ? Math.round((approvedCount / decided) * 100) : null,
      monthly: monthKeys.map((key) => {
        const rows = recent.filter((row) => monthKey(row.createdAt) === key);
        return {
          month: key,
          label: `${THAI_MONTHS[Number(key.slice(5, 7)) - 1]} ${(Number(key.slice(0, 4)) + 543) % 100}`,
          scholarship: rows.filter((row) => row.kind === 'SCHOLARSHIP').length,
          welfare: rows.filter((row) => row.kind === 'WELFARE').length,
        };
      }),
      byIssueType: issueTypes.map((issue) => ({
        code: issue.code,
        label: issue.label,
        total: byIssue.find((row) => row.issueCode === issue.code)?._count._all ?? 0,
      })),
      openByUrgency: urgencyLevels.map((level) => ({
        code: level.code,
        label: level.label,
        tone: level.tone,
        total: openByUrgency.find((row) => row.urgencyCode === level.code)?._count._all ?? 0,
      })),
      topScholarships: topScholarships.map((item) => ({
        id: item.id,
        title: item.title,
        quota: item.quota,
        applicationCount: item._count.requests,
        approvedCount: item.requests.length,
      })),
    };
  }
}
