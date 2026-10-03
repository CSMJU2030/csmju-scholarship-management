import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ApiException } from './api-exception';
import { ErrorCode, ErrorCodeValue, HTTP_STATUS_TO_ERROR_CODE } from './error-codes';

interface ErrorBody {
  success: false;
  error: { code: ErrorCodeValue; message: string; details?: string[] };
}

const PRISMA_POOL_TIMEOUT = 'P2024';
const PRISMA_UNIQUE_VIOLATION = 'P2002';
const PRISMA_RECORD_NOT_FOUND = 'P2025';
const PRISMA_FK_VIOLATION = 'P2003';

function prismaCode(exception: unknown): string | undefined {
  if (typeof exception === 'object' && exception !== null && 'code' in exception) {
    const code = (exception as { code: unknown }).code;
    return typeof code === 'string' && code.startsWith('P') ? code : undefined;
  }
  return undefined;
}

/**
 * แปลง error ทุกชนิดเป็น { success: false, error: { code, message, details } }
 * ห้ามเปิดเผย stack trace · SQL · path ของไฟล์ (api-conventions.md ข้อ 4)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body, retryAfter } = this.toBody(exception);
    if (retryAfter) response.setHeader('Retry-After', String(retryAfter));
    response.status(status).json(body);
  }

  private toBody(exception: unknown): { status: number; body: ErrorBody; retryAfter?: number } {
    if (exception instanceof ApiException) {
      const retry = (exception as { retryAfterSec?: number }).retryAfterSec;
      return {
        status: exception.getStatus(),
        ...(retry ? { retryAfter: retry } : {}),
        body: {
          success: false,
          error: {
            code: exception.code,
            message: exception.message,
            ...(exception.details ? { details: exception.details } : {}),
          },
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const messages =
        typeof raw === 'object' && raw !== null && 'message' in raw
          ? (raw as { message: unknown }).message
          : exception.message;

      // ValidationPipe ส่ง message เป็น array → VALIDATION_ERROR (HTTP 400)
      if (status === HttpStatus.BAD_REQUEST && Array.isArray(messages)) {
        return {
          status,
          body: {
            success: false,
            error: {
              code: ErrorCode.VALIDATION_ERROR,
              message: 'Request validation failed',
              details: messages.map(String),
            },
          },
        };
      }

      const code =
        status === HttpStatus.PAYLOAD_TOO_LARGE
          ? ErrorCode.VALIDATION_ERROR
          : (HTTP_STATUS_TO_ERROR_CODE[status] ?? (status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST));
      const httpStatus = status === HttpStatus.PAYLOAD_TOO_LARGE ? HttpStatus.BAD_REQUEST : status;
      const message = status === HttpStatus.NOT_FOUND ? 'Resource not found' : String(messages);
      return {
        status: httpStatus,
        body: { success: false, error: { code, message } },
        retryAfter: status === 429 || status === 503 ? 5 : undefined,
      };
    }

    switch (prismaCode(exception)) {
      case PRISMA_POOL_TIMEOUT:
        return {
          status: HttpStatus.SERVICE_UNAVAILABLE,
          body: { success: false, error: { code: ErrorCode.SERVICE_UNAVAILABLE, message: 'Try again shortly' } },
          retryAfter: 5,
        };
      case PRISMA_UNIQUE_VIOLATION:
        return {
          status: HttpStatus.CONFLICT,
          body: { success: false, error: { code: ErrorCode.CONFLICT, message: 'ข้อมูลนี้มีอยู่ในระบบแล้ว' } },
        };
      case PRISMA_RECORD_NOT_FOUND:
        return {
          status: HttpStatus.NOT_FOUND,
          body: { success: false, error: { code: ErrorCode.NOT_FOUND, message: 'ไม่พบข้อมูลที่ต้องการ' } },
        };
      case PRISMA_FK_VIOLATION:
        return {
          status: HttpStatus.CONFLICT,
          body: { success: false, error: { code: ErrorCode.CONFLICT, message: 'ข้อมูลอ้างอิงไม่ถูกต้อง' } },
        };
      default:
        break;
    }

    // log ไว้ฝั่งเซิร์ฟเวอร์เท่านั้น — ไม่ส่งรายละเอียดกลับไปยังผู้เรียก
    this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception));
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { success: false, error: { code: ErrorCode.INTERNAL_ERROR, message: 'Internal server error' } },
    };
  }
}
