import { Injectable } from '@nestjs/common';
import { Paginated } from '../common/paginated';
import { validationError } from '../common/api-exception';
import { PrismaService } from '../prisma/prisma.service';

export type LookupKind =
  | 'requestStatus'
  | 'urgencyLevel'
  | 'scholarshipType'
  | 'issueType'
  | 'familyStatus'
  | 'payoutMethod';

export interface LookupItem {
  code: string;
  label: string;
  tone?: string;
  isFinal?: boolean;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
}

interface LookupRow {
  code: string;
  label: string;
  tone?: string;
  isFinal?: boolean;
  sortOrder: number;
  isActive: boolean;
  updatedAt: Date;
}

interface LookupDelegate {
  findMany(args: { where?: { isActive?: boolean }; orderBy: Array<Record<string, 'asc'>> }): Promise<LookupRow[]>;
  findUnique(args: { where: { code: string } }): Promise<LookupRow | null>;
}

@Injectable()
export class LookupsService {
  constructor(private readonly prisma: PrismaService) {}

  private delegate(kind: LookupKind): LookupDelegate {
    return this.prisma[kind] as unknown as LookupDelegate;
  }

  async list(kind: LookupKind): Promise<Paginated<LookupItem>> {
    const rows = await this.delegate(kind).findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
    const items = rows.map((row) => ({
      code: row.code,
      label: row.label,
      ...(row.tone !== undefined ? { tone: row.tone } : {}),
      ...(row.isFinal !== undefined ? { isFinal: row.isFinal } : {}),
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      updatedAt: row.updatedAt.toISOString(),
    }));
    return new Paginated(items, items.length, 1, Math.max(items.length, 1));
  }

  /** code ต้องมีอยู่จริงและเปิดใช้งาน ไม่งั้น → 400 VALIDATION_ERROR */
  async assertActive(kind: LookupKind, code: string, field: string): Promise<void> {
    const row = await this.delegate(kind).findUnique({ where: { code } });
    if (!row || !row.isActive) throw validationError(`${field} is not a valid code`, [`${field} is not a valid code`]);
  }
}
