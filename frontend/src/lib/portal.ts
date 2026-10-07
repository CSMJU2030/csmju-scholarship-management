'use client';

import { useEffect, useState } from 'react';
import { api, type Schemas } from './api';

export type Portal = Schemas['PortalDto'];
type Health = Schemas['HealthDto'];

/**
 * สถานะพอร์ทัล CSMJU2030 (Core Hub) จาก GET /api/health ของ backend
 * — การเข้าสู่ระบบทำที่พอร์ทัลเท่านั้น ระบบนี้จะพาไป SSO ก็ต่อเมื่อพอร์ทัลออนไลน์อยู่
 */
let cached: { portal: Portal; at: number } | null = null;
let inflight: Promise<Portal> | null = null;

export function lastKnownPortal(): Portal | null {
  return cached?.portal ?? null;
}

export async function fetchPortal(force = false): Promise<Portal> {
  if (!force && cached && Date.now() - cached.at < 30_000) return cached.portal;
  if (!inflight) {
    inflight = api
      .get<Health>('/api/health')
      .then((health) => health.portal)
      .catch(() => ({ url: '', reachable: false }))
      .then((portal) => {
        cached = { portal, at: Date.now() };
        inflight = null;
        return portal;
      });
  }
  return inflight;
}

export function usePortal() {
  const [portal, setPortal] = useState<Portal | null>(lastKnownPortal);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fetchPortal(version > 0).then((value) => !cancelled && setPortal(value));
    return () => {
      cancelled = true;
    };
  }, [version]);
  return { portal, recheck: () => setVersion((v) => v + 1) };
}
