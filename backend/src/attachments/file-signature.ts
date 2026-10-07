/**
 * ชนิดไฟล์ที่รับ ตรวจจาก byte ต้นไฟล์ (standards deployment.md ข้อ 4.3)
 * ห้ามเชื่อชื่อไฟล์หรือ Content-Type ที่ผู้ใช้ส่งมา · ไม่รับ SVG / HTML
 */
export const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_TYPES)[number];

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
  return buffer.length >= offset + bytes.length && bytes.every((byte, index) => buffer[offset + index] === byte);
}

export function detectMimeType(buffer: Buffer): AllowedMimeType | null {
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'application/pdf'; // %PDF-
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  // RIFF....WEBP
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }
  return null;
}
