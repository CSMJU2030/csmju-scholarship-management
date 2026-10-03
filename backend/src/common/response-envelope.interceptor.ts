import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Paginated } from './paginated';

/**
 * ห่อทุกคำตอบด้วย envelope มาตรฐาน (api-conventions.md ข้อ 3)
 *   วัตถุเดี่ยว  → { success: true, data }
 *   collection  → { success: true, data: [], meta: { total, page, limit, totalPages } }
 * ไฟล์ (StreamableFile) ส่งตรงโดยไม่ห่อ
 */
@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (value instanceof StreamableFile) return value;
        if (value instanceof Paginated) {
          return { success: true, data: value.items, meta: value.meta };
        }
        return { success: true, data: value ?? null };
      }),
    );
  }
}
