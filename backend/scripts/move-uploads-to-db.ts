/**
 * ย้ายไฟล์แนบเก่าจาก backend/uploads (UPLOAD_DIR) เข้าคอลัมน์ content ของตาราง attachments — ใช้ครั้งเดียวต่อเครื่อง
 * จำเป็นเฉพาะเครื่องที่มีไฟล์แนบเก่า: db:migrate จะตกที่ 20261007090100 (content ยังว่าง) — แก้ตามลำดับนี้
 * (standards deployment.md ข้อ 4.3):
 *   pnpm --filter backend exec prisma migrate resolve --rolled-back 20261007090100_attachments_content_required
 *   pnpm --filter backend exec ts-node scripts/move-uploads-to-db.ts
 *   pnpm --filter backend db:migrate
 * ใช้ pg ตรง ๆ เพราะ Prisma client รุ่นปัจจุบันไม่มีคอลัมน์ stored_name แล้ว
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { Client } from 'pg';
import { detectMimeType } from '../src/attachments/file-signature';

async function main(): Promise<void> {
  const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
  const dir = isAbsolute(uploadDir) ? uploadDir : resolve(process.cwd(), uploadDir);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query<{ id: string; stored_name: string }>(
      'SELECT id, stored_name FROM attachments WHERE content IS NULL ORDER BY created_at',
    );
    let moved = 0;
    const missing: string[] = [];
    for (const row of rows) {
      let content: Buffer;
      try {
        content = await readFile(join(dir, row.stored_name));
      } catch {
        missing.push(row.id);
        continue;
      }
      const mimeType = detectMimeType(content);
      if (!mimeType) {
        missing.push(row.id);
        continue;
      }
      const sha256 = createHash('sha256').update(content).digest('hex');
      await client.query(
        'UPDATE attachments SET content = $1, sha256 = $2, mime_type = $3, size_bytes = $4 WHERE id = $5',
        [content, sha256, mimeType, content.length, row.id],
      );
      moved += 1;
    }
    console.log(JSON.stringify({ event: 'attachments.moved_to_db', moved, missing }));
    if (missing.length > 0) {
      console.error('ไฟล์แนบบางแถวไม่มีไฟล์บนดิสก์หรือชนิดไม่ถูกต้อง — ลบแถวเหล่านั้นเองก่อนรัน migration ขั้นถัดไป');
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

void main();
