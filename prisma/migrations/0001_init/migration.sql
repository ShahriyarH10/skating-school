-- Initial production schema
CREATE TYPE "Role" AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'bkash', 'nagad', 'rocket', 'bank_transfer');
CREATE TYPE "PaymentType" AS ENUM ('monthly_fee', 'admission_fee', 'equipment', 'event_fee');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "role" "Role" NOT NULL,
  "avatar" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_active_idx" ON "users"("role", "active");

CREATE TABLE "clubs" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "clubs_name_key" ON "clubs"("name");

CREATE TABLE "instructors" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "specialization" TEXT,
  "bio" TEXT,
  "club_id" TEXT,
  CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "instructors_user_id_key" ON "instructors"("user_id");

CREATE TABLE "students" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "age" INTEGER,
  "guardian" TEXT,
  "program" TEXT NOT NULL DEFAULT 'Beginner',
  "club_id" TEXT,
  "enroll_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");
CREATE INDEX "students_club_id_idx" ON "students"("club_id");
CREATE INDEX "students_enroll_date_idx" ON "students"("enroll_date");

CREATE TABLE "attendance" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "status" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "marked_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "attendance_date_student_id_key" ON "attendance"("date", "student_id");
CREATE INDEX "attendance_student_id_date_idx" ON "attendance"("student_id", "date");
CREATE INDEX "attendance_marked_by_id_date_idx" ON "attendance"("marked_by_id", "date");

CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "method" "PaymentMethod" NOT NULL DEFAULT 'cash',
  "type" "PaymentType" NOT NULL DEFAULT 'monthly_fee',
  "month" TEXT NOT NULL,
  "receipt_no" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payments_receipt_no_key" ON "payments"("receipt_no");
CREATE INDEX "payments_student_id_date_idx" ON "payments"("student_id", "date");
CREATE INDEX "payments_date_idx" ON "payments"("date");

CREATE TABLE "schedules" (
  "id" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "program" TEXT NOT NULL,
  "club_id" TEXT NOT NULL,
  "instructor_id" TEXT NOT NULL,
  CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "schedules_club_id_day_idx" ON "schedules"("club_id", "day");
CREATE INDEX "schedules_instructor_id_day_idx" ON "schedules"("instructor_id", "day");

CREATE TABLE "notices" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "audience" TEXT NOT NULL DEFAULT 'All',
  "urgent" BOOLEAN NOT NULL DEFAULT false,
  "author_id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "notices_date_idx" ON "notices"("date");
CREATE INDEX "notices_author_id_date_idx" ON "notices"("author_id", "date");

CREATE TABLE "settings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

ALTER TABLE "instructors" ADD CONSTRAINT "instructors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "instructors" ADD CONSTRAINT "instructors_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_id_fkey" FOREIGN KEY ("marked_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notices" ADD CONSTRAINT "notices_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
