import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodeValue } from './error-codes';

/**
 * exception ของโดเมน — ระบุ error.code จากรายการปิด และข้อความที่ปลอดภัยต่อการแสดงผู้ใช้
 * details เป็น array ของข้อความ (api-conventions.md ข้อ 4)
 */
export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: ErrorCodeValue,
    message: string,
    readonly details?: string[],
  ) {
    super({ code, message, details }, status);
  }
}

export const validationError = (message: string, details: string[] = [message]) =>
  new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, message, details);

export const notFound = (message = 'ไม่พบข้อมูลที่ต้องการ') =>
  new ApiException(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, message);

export const conflict = (message: string) =>
  new ApiException(HttpStatus.CONFLICT, ErrorCode.CONFLICT, message);

export const forbidden = (message = 'คุณไม่มีสิทธิ์ทำรายการนี้') =>
  new ApiException(HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN, message);

export const unauthorized = (message = 'Missing or invalid token') =>
  new ApiException(HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED, message);

export const badRequest = (message: string) =>
  new ApiException(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, message);
