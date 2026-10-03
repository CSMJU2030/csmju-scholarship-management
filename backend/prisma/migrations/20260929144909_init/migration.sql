-- CreateEnum
CREATE TYPE "RequestKind" AS ENUM ('SCHOLARSHIP', 'WELFARE');

-- CreateTable
CREATE TABLE "request_statuses" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'neutral',
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "request_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "urgency_levels" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT 'neutral',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "urgency_levels_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "scholarship_types" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "scholarship_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "issue_types" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "issue_types_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "family_statuses" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "family_statuses_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "payout_methods" (
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payout_methods_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "student_code" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "national_id" TEXT,
    "phone" TEXT NOT NULL,
    "year_level" TEXT,
    "program" TEXT,
    "gpa_hundredths" INTEGER,
    "age" INTEGER,
    "nationality" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scholarships" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type_code" TEXT NOT NULL,
    "amount_min_satang" INTEGER NOT NULL DEFAULT 0,
    "amount_max_satang" INTEGER NOT NULL,
    "amount_note" TEXT NOT NULL DEFAULT '',
    "deadline" DATE NOT NULL,
    "quota" INTEGER NOT NULL DEFAULT 0,
    "criteria" TEXT NOT NULL,
    "min_gpa_hundredths" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_core_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "tracking_no" TEXT NOT NULL,
    "kind" "RequestKind" NOT NULL,
    "student_id" TEXT NOT NULL,
    "core_user_id" TEXT NOT NULL,
    "scholarship_id" TEXT,
    "issue_code" TEXT,
    "urgency_code" TEXT,
    "family_income_satang" INTEGER,
    "family_status_code" TEXT,
    "family_expenses" TEXT,
    "amount_requested_satang" INTEGER NOT NULL,
    "amount_approved_satang" INTEGER,
    "payout_code" TEXT NOT NULL,
    "payout_account" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status_code" TEXT NOT NULL,
    "staff_note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "stored_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_core_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_status_histories" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "from_status_code" TEXT,
    "to_status_code" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "changed_by_core_user_id" TEXT NOT NULL,
    "changed_by_role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "request_status_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_core_user_id_key" ON "students"("core_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_code_key" ON "students"("student_code");

-- CreateIndex
CREATE INDEX "scholarships_deadline_idx" ON "scholarships"("deadline");

-- CreateIndex
CREATE INDEX "scholarships_is_active_idx" ON "scholarships"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "requests_tracking_no_key" ON "requests"("tracking_no");

-- CreateIndex
CREATE INDEX "requests_core_user_id_idx" ON "requests"("core_user_id");

-- CreateIndex
CREATE INDEX "requests_kind_idx" ON "requests"("kind");

-- CreateIndex
CREATE INDEX "requests_status_code_idx" ON "requests"("status_code");

-- CreateIndex
CREATE INDEX "requests_created_at_idx" ON "requests"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "requests_student_id_scholarship_id_key" ON "requests"("student_id", "scholarship_id");

-- CreateIndex
CREATE INDEX "attachments_request_id_idx" ON "attachments"("request_id");

-- CreateIndex
CREATE INDEX "request_status_histories_request_id_created_at_idx" ON "request_status_histories"("request_id", "created_at");

-- AddForeignKey
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_type_code_fkey" FOREIGN KEY ("type_code") REFERENCES "scholarship_types"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_issue_code_fkey" FOREIGN KEY ("issue_code") REFERENCES "issue_types"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_urgency_code_fkey" FOREIGN KEY ("urgency_code") REFERENCES "urgency_levels"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_family_status_code_fkey" FOREIGN KEY ("family_status_code") REFERENCES "family_statuses"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_payout_code_fkey" FOREIGN KEY ("payout_code") REFERENCES "payout_methods"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_status_code_fkey" FOREIGN KEY ("status_code") REFERENCES "request_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_status_histories" ADD CONSTRAINT "request_status_histories_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_status_histories" ADD CONSTRAINT "request_status_histories_from_status_code_fkey" FOREIGN KEY ("from_status_code") REFERENCES "request_statuses"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_status_histories" ADD CONSTRAINT "request_status_histories_to_status_code_fkey" FOREIGN KEY ("to_status_code") REFERENCES "request_statuses"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
