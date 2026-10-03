-- DropIndex
DROP INDEX "requests_student_id_scholarship_id_key";

-- CreateIndex
CREATE INDEX "requests_student_id_scholarship_id_idx" ON "requests"("student_id", "scholarship_id");
