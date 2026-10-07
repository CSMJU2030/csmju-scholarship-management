import type { Prisma } from '../generated/prisma/client';

const PREFIX: Record<'SCHOLARSHIP' | 'WELFARE', string> = { SCHOLARSHIP: 'SCH', WELFARE: 'EMG' };

/** รหัสติดตามเรียงลำดับต่อปี รูปแบบ MJU-SCH-2026-0001 / MJU-EMG-2026-0001 */
export async function nextTrackingNo(
  tx: Prisma.TransactionClient,
  kind: 'SCHOLARSHIP' | 'WELFARE',
  now: Date = new Date(),
): Promise<string> {
  const prefix = `MJU-${PREFIX[kind]}-${now.getUTCFullYear()}-`;
  const last = await tx.applicationRequest.findFirst({
    where: { trackingNo: { startsWith: prefix } },
    orderBy: { trackingNo: 'desc' },
    select: { trackingNo: true },
  });
  const seq = last ? Number(last.trackingNo.slice(prefix.length)) || 0 : 0;
  return `${prefix}${String(seq + 1).padStart(4, '0')}`;
}
