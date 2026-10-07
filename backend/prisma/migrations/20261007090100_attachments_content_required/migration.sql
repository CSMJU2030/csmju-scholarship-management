-- ไฟล์แนบทุกแถวต้องมีต้นฉบับและ sha256 แล้ว (ดู 20261007090000) — ชื่อไฟล์บนดิสก์เลิกใช้
ALTER TABLE "attachments"
  ALTER COLUMN "sha256" SET NOT NULL,
  ALTER COLUMN "content" SET NOT NULL,
  DROP COLUMN "stored_name";
