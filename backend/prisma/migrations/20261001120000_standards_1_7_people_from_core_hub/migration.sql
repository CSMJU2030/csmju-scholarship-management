-- standards 1.7.0 (data-dictionary 1.1 · reference-data 1.3 ข้อ 8)
-- ระบบย่อยห้ามมีตารางบุคคลของตัวเองและห้ามเก็บชื่อ — เก็บแค่ core_user_id + person_code
-- ข้อมูลที่ผู้ยื่นแจ้งในคำร้อง (เบอร์ติดต่อ · GPA · อายุ · สัญชาติ · เลขบัตร) ย้ายไปอยู่กับคำร้อง แล้วลบตาราง students

-- 1) เพิ่มคอลัมน์ในคำร้อง
ALTER TABLE "requests"
  ADD COLUMN "person_code" TEXT,
  ADD COLUMN "contact_phone" TEXT,
  ADD COLUMN "gpa_hundredths" INTEGER,
  ADD COLUMN "age" INTEGER,
  ADD COLUMN "nationality" TEXT,
  ADD COLUMN "national_id" TEXT;

-- 2) ย้ายข้อมูลเดิม (รหัสนักศึกษาเดิม = person_code ของนักศึกษา) — ชื่อ ชั้นปี สาขา ไม่ย้าย (ดูจาก Core Hub แทน)
UPDATE "requests" r
SET "person_code"    = s."student_code",
    "contact_phone"  = s."phone",
    "gpa_hundredths" = CASE WHEN r."kind" = 'SCHOLARSHIP' THEN s."gpa_hundredths" END,
    "age"            = CASE WHEN r."kind" = 'SCHOLARSHIP' THEN s."age" END,
    "nationality"    = CASE WHEN r."kind" = 'SCHOLARSHIP' THEN s."nationality" END,
    "national_id"    = CASE WHEN r."kind" = 'SCHOLARSHIP' THEN s."national_id" END
FROM "students" s
WHERE s."id" = r."student_id";

UPDATE "requests" SET "contact_phone" = '' WHERE "contact_phone" IS NULL;
ALTER TABLE "requests" ALTER COLUMN "contact_phone" SET NOT NULL;

-- 3) ตัดความสัมพันธ์กับ students แล้วลบตาราง
ALTER TABLE "requests" DROP CONSTRAINT "requests_student_id_fkey";
DROP INDEX "requests_student_id_scholarship_id_idx";
ALTER TABLE "requests" DROP COLUMN "student_id";
DROP TABLE "students";

-- 4) index ใหม่
CREATE INDEX "requests_core_user_id_scholarship_id_idx" ON "requests"("core_user_id", "scholarship_id");
CREATE INDEX "requests_person_code_idx" ON "requests"("person_code");
