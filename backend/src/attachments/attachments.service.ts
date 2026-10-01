import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import type { AuthenticatedUser } from '../auth/core-hub-identity';
import { hasPermission, Permission } from '../auth/permissions';
import { conflict, forbidden, notFound, validationError } from '../common/api-exception';
import { Paginated } from '../common/paginated';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';

/** รับเฉพาะรูปและ PDF · ตั้งชื่อไฟล์ใหม่เป็น uuid ไม่ใช้ชื่อจากผู้ใช้ */
export const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
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

@Injectable()
export class AttachmentsService implements OnModuleInit {
  private readonly dir: string;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    this.dir = isAbsolute(config.uploadDir) ? config.uploadDir : resolve(process.cwd(), config.uploadDir);
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.dir, { recursive: true });
  }

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
    });
    const items = rows.map((row) => ({
      id: row.id,
      requestId: row.requestId,
      originalName: row.originalName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
    }));
    return new Paginated(items, items.length, 1, Math.max(items.length, 1));
  }

  async upload(user: AuthenticatedUser, requestId: string, file: UploadedFileLike | undefined): Promise<AttachmentView> {
    // แนบไฟล์ได้เฉพาะเจ้าของคำร้อง
    const request = await this.requestFor(user, requestId, Permission.ATTACHMENT_CREATE_OWN);
    if (request.coreUserId !== user.coreUserId) throw forbidden('แนบไฟล์ได้เฉพาะคำร้องของตัวเอง');
    if (!file || !file.buffer?.length) throw validationError('file is required');
    const extension = ALLOWED_MIME[file.mimetype];
    if (!extension) throw validationError('รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ PDF เท่านั้น');
    if (file.size > this.config.maxUploadBytes) throw validationError('ไฟล์มีขนาดเกินกำหนด');
    if (request._count.attachments >= MAX_FILES_PER_REQUEST) {
      throw conflict(`แนบไฟล์ได้ไม่เกิน ${MAX_FILES_PER_REQUEST} ไฟล์ต่อคำร้อง`);
    }

    const row = await this.prisma.attachment.create({
      data: {
        requestId,
        originalName: file.originalname.slice(0, 200) || 'attachment',
        storedName: 'pending',
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedByCoreUserId: user.coreUserId,
      },
    });
    const storedName = `${row.id}${extension}`;
    try {
      await writeFile(join(this.dir, storedName), file.buffer);
    } catch (error) {
      await this.prisma.attachment.delete({ where: { id: row.id } });
      throw error;
    }
    await this.prisma.attachment.update({ where: { id: row.id }, data: { storedName } });
    return {
      id: row.id,
      requestId,
      originalName: row.originalName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async open(user: AuthenticatedUser, attachmentId: string) {
    const row = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { request: { select: { coreUserId: true } } },
    });
    if (!row) throw notFound('ไม่พบไฟล์แนบ');
    if (row.request.coreUserId !== user.coreUserId && !hasPermission(user.permissions, Permission.ATTACHMENT_READ_ANY)) {
      throw forbidden('คุณไม่มีสิทธิ์เปิดไฟล์นี้');
    }
    const path = join(this.dir, row.storedName);
    try {
      await access(path);
    } catch {
      throw notFound('ไฟล์แนบหายไปจากที่จัดเก็บ');
    }
    return { stream: createReadStream(path), mimeType: row.mimeType, originalName: row.originalName, sizeBytes: row.sizeBytes };
  }

  /** ใช้ตอนลบคำร้อง (ยังไม่มี endpoint ลบในเวอร์ชันนี้) */
  async removeFile(storedName: string): Promise<void> {
    await unlink(join(this.dir, storedName)).catch(() => undefined);
  }
}
