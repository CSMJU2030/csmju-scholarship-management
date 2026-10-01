import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiEnvelope } from '../common/api-envelope.decorator';
import { ApiException } from '../common/api-exception';
import { MeDto } from '../common/api-models';
import { toGpa } from '../common/money';
import { PeopleService, toPersonView } from '../core-hub/people.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './core-hub-identity';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserToken } from './decorators/user-token.decorator';

/**
 * GET /api/v1/me — ตัวตนจาก token + role ในระบบนี้
 *  + person: ข้อมูลบุคคลจาก Core Hub /people/me (ไม่เก็บ ไม่ cache — standards 1.7.0)
 *  + lastApplication: ค่าที่ผู้ใช้เคยกรอกในคำร้องล่าสุดของตัวเอง ใช้เติมฟอร์มให้ครั้งถัดไป
 */
@ApiTags('me')
@ApiBearerAuth()
@Controller('v1/me')
export class MeController {
  constructor(
    private readonly people: PeopleService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'ข้อมูลผู้ใช้ปัจจุบัน' })
  @ApiEnvelope(MeDto)
  @Get()
  async me(@CurrentUser() user: AuthenticatedUser, @UserToken() token: string) {
    // guest ไม่มีสิทธิ์ /people/me (403) · Core Hub ล่ม → personStatus บอกหน้าเว็บ แต่ /me ยังตอบได้
    let person = null;
    let personStatus: 'linked' | 'unlinked' | 'unavailable' = 'unlinked';
    try {
      const found = await this.people.me(token);
      person = found ? toPersonView(found) : null;
      personStatus = found ? 'linked' : 'unlinked';
    } catch (error) {
      if (error instanceof ApiException && error.code === 'UNAUTHORIZED') throw error;
      personStatus = error instanceof ApiException && error.code === 'FORBIDDEN' ? 'unlinked' : 'unavailable';
    }

    const last = await this.prisma.applicationRequest.findFirst({
      where: { coreUserId: user.coreUserId },
      orderBy: { createdAt: 'desc' },
      select: { contactPhone: true, gpaHundredths: true, age: true, nationality: true, payoutCode: true, payoutAccount: true },
    });
    const lastScholarship = await this.prisma.applicationRequest.findFirst({
      where: { coreUserId: user.coreUserId, kind: 'SCHOLARSHIP' },
      orderBy: { createdAt: 'desc' },
      select: { gpaHundredths: true, age: true, nationality: true },
    });

    return {
      id: user.coreUserId,
      email: user.email,
      coreRole: user.coreRole,
      subsystemRole: user.subsystemRole,
      permissions: user.permissions,
      session: { expiresAt: user.expiresAt },
      person,
      personStatus,
      lastApplication: last
        ? {
            contactPhone: last.contactPhone,
            payoutCode: last.payoutCode,
            payoutAccount: last.payoutAccount,
            gpa: toGpa(lastScholarship?.gpaHundredths ?? null),
            age: lastScholarship?.age ?? null,
            nationality: lastScholarship?.nationality ?? null,
          }
        : null,
    };
  }
}
