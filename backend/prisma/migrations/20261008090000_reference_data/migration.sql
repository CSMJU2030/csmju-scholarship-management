-- ข้อมูลอ้างอิงของระบบ (สถานะ · ความเร่งด่วน · ประเภททุน · ประเภทความเดือดร้อน · สถานะครอบครัว · ช่องทางรับเงิน)
-- เดิมมีแค่ใน prisma/seed.ts แต่ server รันแค่ prisma migrate deploy และห้าม seed ตอนสตาร์ต (standards deployment.md ข้อ 3.4 · 6.1)
-- ฐานใหม่บน server จึงไม่มีตัวเลือกในฟอร์ม — ใส่ผ่าน migration แทน · ON CONFLICT DO NOTHING: ฐานที่ seed แล้วไม่เปลี่ยน
-- ค่าตรงกับ prisma/seed.ts — เพิ่มหรือแก้ค่าทีหลังให้เขียน migration ใหม่ และแก้ seed.ts ให้ตรงกัน

INSERT INTO "request_statuses" ("code", "label", "tone", "is_final", "sort_order", "updated_at") VALUES
  ('PENDING_ADVISOR', 'รออาจารย์ที่ปรึกษาตรวจสอบ', 'neutral', false, 1, CURRENT_TIMESTAMP),
  ('UNDER_REVIEW', 'อยู่ระหว่างพิจารณาของคณะกรรมการ', 'info', false, 2, CURRENT_TIMESTAMP),
  ('PRE_APPROVED', 'ผ่านการอนุมัติขั้นต้น (รอเบิกจ่าย)', 'info', false, 3, CURRENT_TIMESTAMP),
  ('APPROVED', 'อนุมัติเรียบร้อยแล้ว', 'success', true, 4, CURRENT_TIMESTAMP),
  ('REJECTED', 'ไม่ผ่านเกณฑ์การพิจารณา', 'danger', true, 5, CURRENT_TIMESTAMP),
  ('CANCELLED', 'ยกเลิกคำร้อง', 'danger', true, 6, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "urgency_levels" ("code", "label", "tone", "sort_order", "updated_at") VALUES
  ('NORMAL', 'ปกติ', 'neutral', 1, CURRENT_TIMESTAMP),
  ('MEDIUM', 'ปานกลาง', 'info', 2, CURRENT_TIMESTAMP),
  ('URGENT', 'ด่วน', 'warning', 3, CURRENT_TIMESTAMP),
  ('CRITICAL', 'วิกฤตเร่งด่วน', 'danger', 4, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "scholarship_types" ("code", "label", "sort_order", "updated_at") VALUES
  ('DEPARTMENT', 'ทุนภายในสาขา (เรียนดี / กิจกรรมเด่น)', 1, CURRENT_TIMESTAMP),
  ('EMERGENCY', 'ทุนช่วยเหลือฉุกเฉิน (ภัยพิบัติ / วิกฤต)', 2, CURRENT_TIMESTAMP),
  ('ALUMNI', 'ทุนศิษย์เก่า CS (เครือข่ายพี่สู่น้อง)', 3, CURRENT_TIMESTAMP),
  ('LIVING', 'ทุนสนับสนุนค่าครองชีพ', 4, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "issue_types" ("code", "label", "sort_order", "updated_at") VALUES
  ('LIVING-COST', 'ภาระค่าครองชีพและค่าใช้จ่ายฉุกเฉิน', 1, CURRENT_TIMESTAMP),
  ('FAMILY-CRISIS', 'ครอบครัวประสบวิกฤตกะทันหัน / ภัยพิบัติ', 2, CURRENT_TIMESTAMP),
  ('MEDICAL', 'อุบัติเหตุ / ค่ารักษาพยาบาลเร่งด่วน', 3, CURRENT_TIMESTAMP),
  ('EQUIPMENT', 'ขาดแคลนอุปกรณ์การเรียนและเครื่องมือโครงงาน', 4, CURRENT_TIMESTAMP),
  ('HOUSING', 'ค่าที่พักอาศัย / ค่าหอพักฉุกเฉิน', 5, CURRENT_TIMESTAMP),
  ('OTHER', 'อื่น ๆ (ระบุในรายละเอียด)', 6, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "family_statuses" ("code", "label", "sort_order", "updated_at") VALUES
  ('TOGETHER', 'บิดามารดาอยู่ด้วยกัน', 1, CURRENT_TIMESTAMP),
  ('DIVORCED', 'บิดามารดาแยกทางกัน / หย่าร้าง', 2, CURRENT_TIMESTAMP),
  ('DECEASED', 'บิดาหรือมารดาเสียชีวิต', 3, CURRENT_TIMESTAMP),
  ('GUARDIAN', 'อยู่ในความดูแลของผู้ปกครองอื่น', 4, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "payout_methods" ("code", "label", "sort_order", "updated_at") VALUES
  ('PROMPTPAY', 'พร้อมเพย์ (PromptPay)', 1, CURRENT_TIMESTAMP),
  ('KTB', 'บัญชีธนาคารกรุงไทย', 2, CURRENT_TIMESTAMP),
  ('SCB', 'บัญชีธนาคารไทยพาณิชย์', 3, CURRENT_TIMESTAMP),
  ('KBANK', 'บัญชีธนาคารกสิกรไทย', 4, CURRENT_TIMESTAMP),
  ('OTHER', 'บัญชีธนาคารอื่น ๆ', 5, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
