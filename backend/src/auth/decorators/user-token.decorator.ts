import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { unauthorized } from '../../common/api-exception';
import { userTokenOf } from '../user-token';

/** token ของผู้ใช้ที่ผ่าน guard แล้ว — ใช้ส่งต่อให้ CoreHubClient เท่านั้น (ห้าม log ห้ามเก็บ) */
export const UserToken = createParamDecorator((_: unknown, context: ExecutionContext): string => {
  const token = userTokenOf(context.switchToHttp().getRequest<Request>());
  if (!token) throw unauthorized();
  return token;
});
