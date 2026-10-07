-- standards 1.8 (deployment.md ข้อ 4.3) — ไฟล์แนบย้ายจากดิสก์ (UPLOAD_DIR) มาเก็บในฐานข้อมูล
-- container บน server อ่านอย่างเดียวและหายเมื่อเริ่มใหม่ จึงเขียนไฟล์ลงดิสก์ไม่ได้
--
-- ขั้นนี้เพิ่มคอลัมน์แบบว่างได้ก่อน: เครื่องที่มีไฟล์แนบเก่าใน backend/uploads ให้รัน
--   pnpm --filter backend exec ts-node scripts/move-uploads-to-db.ts
-- ระหว่างขั้นนี้กับขั้นถัดไป (20261007090100) — ฐานบน server ยังไม่มีไฟล์แนบ จึงผ่านทั้งสองขั้นได้ทันที
ALTER TABLE "attachments"
  ADD COLUMN "sha256" CHAR(64),
  ADD COLUMN "content" BYTEA;
