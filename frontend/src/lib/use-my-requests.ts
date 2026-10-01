'use client';

import { fetchAll, type Me, type RequestSummary } from './api';
import { useAsync } from './use-async';

/** คำร้องของผู้ใช้คนนี้ (เจ้าหน้าที่ได้ทุกรายการจาก API จึงกรองด้วย coreUserId อีกชั้น) */
export function useMyRequests(me: Me, enabled = true) {
  const canRead = enabled && Boolean(me.id) && me.permissions.includes('request:read:own');
  return useAsync<RequestSummary[]>(
    async () => (canRead ? (await fetchAll<RequestSummary>('/api/v1/requests')).filter((item) => item.coreUserId === me.id) : []),
    [me.id, canRead],
  );
}

/** ใบสมัครที่ยังไม่ถูกยกเลิกของแต่ละทุน → ใช้แสดงป้าย "สมัครแล้ว" */
export function appliedByScholarship(requests: RequestSummary[] | undefined) {
  const map = new Map<string, { label: string; tone: string; trackingNo: string }>();
  for (const item of requests ?? []) {
    if (item.kind !== 'SCHOLARSHIP' || !item.scholarshipId || item.statusCode === 'CANCELLED') continue;
    if (!map.has(item.scholarshipId)) map.set(item.scholarshipId, { label: item.statusLabel, tone: item.statusTone, trackingNo: item.trackingNo });
  }
  return map;
}
