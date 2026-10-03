import { applyDecorators, HttpStatus, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorBodyDto, PaginationMetaDto } from './api-models';

/** ประกาศรูปแบบ envelope { success, data[, meta] } ใน openapi.json ให้ frontend generate type ได้ */
export function ApiEnvelope(model: Type<unknown>, options: { collection?: boolean; status?: HttpStatus } = {}) {
  const data = options.collection
    ? { type: 'array', items: { $ref: getSchemaPath(model) } }
    : { $ref: getSchemaPath(model) };
  return applyDecorators(
    ApiExtraModels(model, PaginationMetaDto, ErrorBodyDto),
    ApiResponse({
      status: options.status ?? HttpStatus.OK,
      schema: {
        type: 'object',
        required: options.collection ? ['success', 'data', 'meta'] : ['success', 'data'],
        properties: {
          success: { type: 'boolean', enum: [true] },
          data,
          ...(options.collection ? { meta: { $ref: getSchemaPath(PaginationMetaDto) } } : {}),
        },
      },
    }),
    ApiResponse({ status: 'default', description: 'error envelope', type: ErrorBodyDto }),
  );
}
