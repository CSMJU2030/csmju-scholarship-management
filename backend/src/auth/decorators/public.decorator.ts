import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** ใช้ได้กับ 4 path เท่านั้น: GET /api/health · GET /auth/login · GET /auth/callback · POST /auth/logout */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
