/**
 * util แสดงผล (ui-design-system.md ข้อ 11.3) — พ.ศ. · timezone Asia/Bangkok · เงินรับเป็นสตางค์
 * เมื่อมี @csmju2030/design-system ให้เปลี่ยนไปใช้ formatDate/formatMoney ของ package
 */
const TZ = 'Asia/Bangkok';

const dateFmt = new Intl.DateTimeFormat('th-TH', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
const longDateFmt = new Intl.DateTimeFormat('th-TH', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('th-TH', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });

function toDate(value: string): Date | null {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+07:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined, style: 'short' | 'long' = 'short'): string {
  if (!value) return '-';
  const date = toDate(value);
  if (!date) return '-';
  return (style === 'long' ? longDateFmt : dateFmt).format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = toDate(value);
  if (!date) return '-';
  return `${dateFmt.format(date)} ${timeFmt.format(date)} น.`;
}

/** เงินจาก API เป็นสตางค์ → "5,000 บาท" (แสดงทศนิยมเมื่อมีเศษสตางค์) */
export function formatMoney(satang: number | null | undefined): string {
  if (satang === null || satang === undefined) return '-';
  const baht = satang / 100;
  const hasFraction = satang % 100 !== 0;
  return `${baht.toLocaleString('th-TH', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })} บาท`;
}

/** ช่องกรอกจำนวนเงินเป็นบาท (จำนวนเต็ม) → สตางค์ สำหรับส่ง API */
export function bahtInputToSatang(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) * 100 : 0;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('th-TH');
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '-';
  return /^\d{10}$/.test(value) ? `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6)}` : value;
}

export function daysLeftLabel(daysLeft: number): string {
  if (daysLeft < 0) return 'ปิดรับแล้ว';
  if (daysLeft === 0) return 'ปิดรับวันนี้';
  return `เหลือ ${daysLeft} วัน`;
}

/** คำเรียกบทบาทมาตรฐาน (ui-design-system.md ข้อ 10.3) */
export const CORE_ROLE_LABEL: Record<string, string> = {
  student: 'นักศึกษา',
  alumni: 'ศิษย์เก่า',
  staff: 'บุคลากร/อาจารย์',
  admin: 'ผู้ดูแลระบบ',
};

/** ข้อความเวลาแบบสัมพัทธ์ เช่น "3 ชั่วโมงที่แล้ว" */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return '-';
  const date = toDate(value);
  if (!date) return '-';
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} วันที่แล้ว`;
  return formatDate(value);
}
