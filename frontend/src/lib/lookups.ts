'use client';

import { useEffect, useState } from 'react';
import { fetchAll, type LookupItem } from './api';

export type LookupKey = 'request-statuses' | 'urgency-levels' | 'scholarship-types' | 'issue-types' | 'family-statuses' | 'payout-methods';

/** โหลดข้อมูลอ้างอิงจาก backend (ระบบเก็บแค่ code · ชื่อถามจาก API ตอนแสดงผล) */
export function useLookups(keys: LookupKey[]) {
  const [data, setData] = useState<Partial<Record<LookupKey, LookupItem[]>>>({});
  const [error, setError] = useState<unknown>(null);
  const signature = keys.join(',');

  useEffect(() => {
    let cancelled = false;
    Promise.all(signature.split(',').map(async (key) => [key, await fetchAll<LookupItem>(`/api/v1/${key}`)] as const))
      .then((entries) => !cancelled && setData(Object.fromEntries(entries)))
      .catch((err: unknown) => !cancelled && setError(err));
    return () => {
      cancelled = true;
    };
  }, [signature]);

  return { lookups: data, error, ready: keys.every((key) => data[key]) };
}
