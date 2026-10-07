import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { AuthenticatedUser } from '../auth/core-hub-identity';
import { hasPermission, Permission } from '../auth/permissions';
import { conflict, forbidden, notFound, validationError } from '../common/api-exception';
import { Paginated } from '../common/paginated';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';
import { detectMimeType } from './file-signature';

const MAX_FILES_PER_REQUEST = 10;

export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface AttachmentView {
  id: string;
  requestId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

/** metadata อย่างเดียว — query รายการห้ามดึง content (deployment.md ข้อ 4.3) */
const VIEW_SELECT = {
  id: true,
  requestId: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
} as const;

function toView(row: { id: string; requestId: string; originalName: string; mimeType: string; sizeBytes: number; createdAt: Date }): AttachmentView {
  return {
    id: row.id,
    requestId: row.requestId,
    originalName: row.originalName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * ไฟล์แนบเก็บต้นฉบับในฐานข้อมูลของระบบ (standards deployment.md ข้อ 4.3)
 * container บน server อ่านอย่างเดียว — ห้ามเขียนลงดิสก์
 */
@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private async requestFor(user: AuthenticatedUser, requestId: string, anyPermission: Permission) {
    const request = await this.prisma.applicationRequest.findUnique({
      where: { id: requestId },
      select: { id: true, coreUserId: true, _count: { select: { attachments: true } } },
    });
    if (!request) throw notFound('ไม่พบคำร้องนี้');
    if (request.coreUserId !== user.coreUserId && !hasPermission(user.permissions, anyPermission)) {
      throw forbidden('คุณไม่มีสิทธิ์เข้าถึงคำร้องนี้');
    }
    return request;
  }

  async list(user: AuthenticatedUser, requestId: string): Promise<Paginated<AttachmentView>> {
    await this.requestFor(user, requestId, Permission.ATTACHMENT_READ_ANY);
    const rows = await this.prisma.attachment.findMany({
      where: { requestId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: VIEW_SELECT,
    });
    const items = rows.map(toView);
    return new Paginated(items, items.length, 1, Math.max(items.length, 1));
  }

  async upload(user: AuthenticatedUser, requestId: string, file: UploadedFileLike | undefined): Promise<AttachmentView> {
    // แนบไฟล์ได้เฉพาะเจ้าของคำร้อง
    const request = await this.requestFor(user, requestId, Permission.ATTACHMENT_CREATE_OWN);
    if (request.coreUserId !== user.coreUserId) throw forbidden('แนบไฟล์ได้เฉพาะคำร้องของตัวเอง');
    if (!file || !file.buffer?.length) throw validationError('file is required');
    if (file.buffer.length > this.config.maxUploadBytes) throw validationError('ไฟล์มีขนาดเกินกำหนด');
    // ชนิดไฟล์ดูจาก byte ต้นไฟล์ ไม่เชื่อ Content-Type หรือนามสกุลที่ส่งมา
    const mimeType = detectMimeType(file.buffer);
    if (!mimeType) throw validationError('รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ PDF เท่านั้น');
    if (request._count.attachments >= MAX_FILES_PER_REQUEST) {
      throw conflict(`แนบไฟล์ได้ไม่เกิน ${MAX_FILES_PER_REQUEST} ไฟล์ต่อคำร้อง`);
    }

    const row = await this.prisma.attachment.create({
      data: {
        requestId,
        originalName: file.originalname.slice(0, 200) || 'attachment',
        mimeType,
        sizeBytes: file.buffer.length,
        sha256: createHash('sha256').update(file.buffer).digest('hex'),
        content: new Uint8Array(file.buffer),
        uploadedByCoreUserId: user.coreUserId,
      },
      select: VIEW_SELECT,
    });
    return toView(row);
  }

  async open(user: AuthenticatedUser, attachmentId: string) {
    const row = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: { ...VIEW_SELECT, request: { select: { coreUserId: true } } },
    });
    if (!row) throw notFound('ไม่พบไฟล์แนบ');
    if (row.request.coreUserId !== user.coreUserId && !hasPermission(user.permissions, Permission.ATTACHMENT_READ_ANY)) {
      throw forbidden('คุณไม่มีสิทธิ์เปิดไฟล์นี้');
    }
    // ดึงเนื้อไฟล์หลังตรวจสิทธิ์ผ่านแล้วเท่านั้น
    const { content } = await this.prisma.attachment.findUniqueOrThrow({
      where: { id: attachmentId },
      select: { content: true },
    });
    return { content: Buffer.from(content), mimeType: row.mimeType, originalName: row.originalName, sizeBytes: row.sizeBytes };
  }
}
