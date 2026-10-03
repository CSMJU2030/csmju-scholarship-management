import { ApiEnvelope } from '../common/api-envelope.decorator';
import { AttachmentDto } from '../common/api-models';
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthenticatedUser } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { ParseUuidV4Pipe } from '../common/parse-uuid-v4.pipe';
import { AttachmentsService, type UploadedFileLike } from './attachments.service';

const UPLOAD_LIMIT_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('v1')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @ApiOperation({ summary: 'รายการไฟล์แนบของคำร้อง' })
  @ApiEnvelope(AttachmentDto, { collection: true })
  @RequirePermissions(Permission.ATTACHMENT_READ_OWN, Permission.ATTACHMENT_READ_ANY)
  @Get('requests/:id/attachments')
  list(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUuidV4Pipe) id: string) {
    return this.attachments.list(user, id);
  }

  @ApiOperation({ summary: 'แนบไฟล์หลักฐานให้คำร้องของตัวเอง (multipart field: file)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiEnvelope(AttachmentDto, { status: HttpStatus.CREATED })
  @RequirePermissions(Permission.ATTACHMENT_CREATE_OWN)
  @Post('requests/:id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: UPLOAD_LIMIT_BYTES, files: 1 } }))
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidV4Pipe) id: string,
    @UploadedFile() file: UploadedFileLike | undefined,
  ) {
    return this.attachments.upload(user, id, file);
  }

  @ApiOperation({ summary: 'เปิดไฟล์แนบ (เจ้าของคำร้อง หรือเจ้าหน้าที่)' })
  @ApiProduces('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
  @ApiOkResponse({ description: 'ไฟล์ต้นฉบับ', schema: { type: 'string', format: 'binary' } })
  @RequirePermissions(Permission.ATTACHMENT_READ_OWN, Permission.ATTACHMENT_READ_ANY)
  @Get('attachments/:id')
  async open(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUuidV4Pipe) id: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const file = await this.attachments.open(user, id);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(file.stream, {
      type: file.mimeType,
      length: file.sizeBytes,
      disposition: `inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    });
  }
}
