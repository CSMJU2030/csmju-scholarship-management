'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * ค่าที่จำไว้ในเบราว์เซอร์ต่อผู้ใช้ (ทุนที่บันทึกไว้ · คำร้องที่เปิดดูแล้ว)
 * เป็นแค่ความสะดวกของผู้ใช้แต่ละเครื่อง — ข้อมูลจริงทั้งหมดอยู่ที่ backend
 * ใช้ useSyncExternalStore ให้ทุก component (เช่น กระดิ่งแจ้งเตือนกับรายการ) เห็นค่าเดียวกันทันที
 */
const listeners = new Map<string, Set<() => void>>();
const snapshots = new Map<string, string>();

function read(key: string): string {
  if (!snapshots.has(key)) {
    let raw = '';
    try {
      raw = window.localStorage.getItem(key) ?? '';
    } catch {
      raw = '';
    }
    snapshots.set(key, raw);
  }
  return snapshots.get(key) ?? '';
}

function write(key: string, raw: string) {
  snapshots.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // โหมดส่วนตัว/ถูกบล็อก — ยังใช้งานได้ในหน้านี้
  }
  listeners.get(key)?.forEach((fn) => fn());
}

function subscribe(key: string, fn: () => void) {
  const set = listeners.get(key) ?? new Set();
  set.add(fn);
  listeners.set(key, set);
  return () => set.delete(fn);
}

function parse<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function useStoredRaw(key: string) {
  return useSyncExternalStore(
    useCallback((fn) => subscribe(key, fn), [key]),
    () => read(key),
    () => '',
  );
}

/** ทุนที่บันทึกไว้ (ดาว) ต่อผู้ใช้ */
export function useFavorites(coreUserId: string) {
  const key = `csmju_scholarship_fav_${coreUserId || 'guest'}`;
  const raw = useStoredRaw(key);
  const ids = parse<string[]>(raw, []);
  const toggle = useCallback(
    (id: string) => {
      const current = parse<string[]>(read(key), []);
      write(key, JSON.stringify(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));
    },
    [key],
  );
  return { ids, has: (id: string) => ids.includes(id), toggle };
}

/** คำร้องที่ผู้ใช้เปิดดูแล้ว: id → updatedAt ที่เห็นล่าสุด (ใช้ทำป้าย "อัปเดตใหม่" และกระดิ่ง) */
export function useSeenUpdates(coreUserId: string) {
  const key = `csmju_scholarship_seen_${coreUserId || 'guest'}`;
  const raw = useStoredRaw(key);
  const seen = parse<Record<string, string>>(raw, {});
  const markSeen = useCallback(
    (items: Array<{ id: string; updatedAt: string }>) => {
      const current = parse<Record<string, string>>(read(key), {});
      let changed = false;
      for (const item of items) {
        if (current[item.id] !== item.updatedAt) {
          current[item.id] = item.updatedAt;
          changed = true;
        }
      }
      if (changed) write(key, JSON.stringify(current));
    },
    [key],
  );
  /** ครั้งแรกที่ยังไม่มีข้อมูล ให้ถือว่าเห็นทุกอย่างแล้ว ไม่งั้นทุกรายการจะขึ้น "ใหม่" */
  const initialized = raw !== '';
  const isUnseen = (item: { id: string; updatedAt: string; createdAt: string }) =>
    initialized && seen[item.id] !== item.updatedAt && item.updatedAt !== item.createdAt;
  return { seen, initialized, isUnseen, markSeen };
}
