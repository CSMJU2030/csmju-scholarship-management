import { Injectable, PipeTransform } from '@nestjs/common';
import { validationError } from './api-exception';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** path param ต้องเป็น UUID v4 · ไม่ใช่ → 400 VALIDATION_ERROR (api-conventions.md ข้อ 1) */
@Injectable()
export class ParseUuidV4Pipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!UUID_V4.test(value)) throw validationError('id must be a UUID v4');
    return value.toLowerCase();
  }
}
