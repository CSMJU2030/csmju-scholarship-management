/**
 * prisma/seed.ts — ใส่ "ข้อมูลอ้างอิง" ของระบบเท่านั้น (สถานะ ประเภททุน ฯลฯ)
 * ไม่มีข้อมูลจำลองของนักศึกษา / ประกาศทุน / คำร้อง — ข้อมูลธุรกิจทั้งหมดต้องสร้างผ่านระบบจริง
 * รันซ้ำได้ (upsert) ไม่ลบข้อมูลที่มีอยู่
 *
 *   pnpm --filter backend db:seed
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const REQUEST_STATUSES = [
  { code: 'PENDING_ADVISOR', label: 'รออาจารย์ที่ปรึกษาตรวจสอบ', tone: 'neutral', isFinal: false, sortOrder: 1 },
  { code: 'UNDER_REVIEW', label: 'อยู่ระหว่างพิจารณาของคณะกรรมการ', tone: 'info', isFinal: false, sortOrder: 2 },
  { code: 'PRE_APPROVED', label: 'ผ่านการอนุมัติขั้นต้น (รอเบิกจ่าย)', tone: 'info', isFinal: false, sortOrder: 3 },
  { code: 'APPROVED', label: 'อนุมัติเรียบร้อยแล้ว', tone: 'success', isFinal: true, sortOrder: 4 },
  { code: 'REJECTED', label: 'ไม่ผ่านเกณฑ์การพิจารณา', tone: 'danger', isFinal: true, sortOrder: 5 },
  { code: 'CANCELLED', label: 'ยกเลิกคำร้อง', tone: 'danger', isFinal: true, sortOrder: 6 },
];

const URGENCY_LEVELS = [
  { code: 'NORMAL', label: 'ปกติ', tone: 'neutral', sortOrder: 1 },
  { code: 'MEDIUM', label: 'ปานกลาง', tone: 'info', sortOrder: 2 },
  { code: 'URGENT', label: 'ด่วน', tone: 'warning', sortOrder: 3 },
  { code: 'CRITICAL', label: 'วิกฤตเร่งด่วน', tone: 'danger', sortOrder: 4 },
];

const SCHOLARSHIP_TYPES = [
  { code: 'DEPARTMENT', label: 'ทุนภายในสาขา (เรียนดี / กิจกรรมเด่น)', sortOrder: 1 },
  { code: 'EMERGENCY', label: 'ทุนช่วยเหลือฉุกเฉิน (ภัยพิบัติ / วิกฤต)', sortOrder: 2 },
  { code: 'ALUMNI', label: 'ทุนศิษย์เก่า CS (เครือข่ายพี่สู่น้อง)', sortOrder: 3 },
  { code: 'LIVING', label: 'ทุนสนับสนุนค่าครองชีพ', sortOrder: 4 },
];

const ISSUE_TYPES = [
  { code: 'LIVING-COST', label: 'ภาระค่าครองชีพและค่าใช้จ่ายฉุกเฉิน', sortOrder: 1 },
  { code: 'FAMILY-CRISIS', label: 'ครอบครัวประสบวิกฤตกะทันหัน / ภัยพิบัติ', sortOrder: 2 },
  { code: 'MEDICAL', label: 'อุบัติเหตุ / ค่ารักษาพยาบาลเร่งด่วน', sortOrder: 3 },
  { code: 'EQUIPMENT', label: 'ขาดแคลนอุปกรณ์การเรียนและเครื่องมือโครงงาน', sortOrder: 4 },
  { code: 'HOUSING', label: 'ค่าที่พักอาศัย / ค่าหอพักฉุกเฉิน', sortOrder: 5 },
  { code: 'OTHER', label: 'อื่น ๆ (ระบุในรายละเอียด)', sortOrder: 6 },
];

const FAMILY_STATUSES = [
  { code: 'TOGETHER', label: 'บิดามารดาอยู่ด้วยกัน', sortOrder: 1 },
  { code: 'DIVORCED', label: 'บิดามารดาแยกทางกัน / หย่าร้าง', sortOrder: 2 },
  { code: 'DECEASED', label: 'บิดาหรือมารดาเสียชีวิต', sortOrder: 3 },
  { code: 'GUARDIAN', label: 'อยู่ในความดูแลของผู้ปกครองอื่น', sortOrder: 4 },
];

const PAYOUT_METHODS = [
  { code: 'PROMPTPAY', label: 'พร้อมเพย์ (PromptPay)', sortOrder: 1 },
  { code: 'KTB', label: 'บัญชีธนาคารกรุงไทย', sortOrder: 2 },
  { code: 'SCB', label: 'บัญชีธนาคารไทยพาณิชย์', sortOrder: 3 },
  { code: 'KBANK', label: 'บัญชีธนาคารกสิกรไทย', sortOrder: 4 },
  { code: 'OTHER', label: 'บัญชีธนาคารอื่น ๆ', sortOrder: 5 },
];

async function main(): Promise<void> {
  for (const row of REQUEST_STATUSES) {
    await prisma.requestStatus.upsert({ where: { code: row.code }, create: row, update: row });
  }
  for (const row of URGENCY_LEVELS) {
    await prisma.urgencyLevel.upsert({ where: { code: row.code }, create: row, update: row });
  }
  for (const row of SCHOLARSHIP_TYPES) {
    await prisma.scholarshipType.upsert({ where: { code: row.code }, create: row, update: row });
  }
  for (const row of ISSUE_TYPES) {
    await prisma.issueType.upsert({ where: { code: row.code }, create: row, update: row });
  }
  for (const row of FAMILY_STATUSES) {
    await prisma.familyStatus.upsert({ where: { code: row.code }, create: row, update: row });
  }
  for (const row of PAYOUT_METHODS) {
    await prisma.payoutMethod.upsert({ where: { code: row.code }, create: row, update: row });
  }
  console.log('seed: reference data upserted (no demo data)');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
