const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** วันที่ปัจจุบันตามเวลาไทย รูปแบบ YYYY-MM-DD (ใช้เทียบวันปิดรับสมัคร) */
export function todayInBangkok(now: Date = new Date()): string {
  return new Date(now.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

/** จำนวนวันจาก "วันนี้ (เวลาไทย)" ถึงวันที่ที่กำหนด (ติดลบ = เลยมาแล้ว) */
export function daysUntil(date: Date, now: Date = new Date()): number {
  const today = Date.parse(`${todayInBangkok(now)}T00:00:00.000Z`);
  const target = Date.parse(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
  return Math.round((target - today) / 86_400_000);
}

export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const parseIsoDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
