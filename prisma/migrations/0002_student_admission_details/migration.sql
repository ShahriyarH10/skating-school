-- Adds full admission-form fields to "students": address, guardian (father
-- & mother) details, applicant personal details, and admission info.
-- Purely additive / all-nullable — safe to run against existing data.

ALTER TABLE "students"
  ADD COLUMN "present_address" TEXT,
  ADD COLUMN "permanent_address" TEXT,
  ADD COLUMN "father_name" TEXT,
  ADD COLUMN "father_nid" TEXT,
  ADD COLUMN "father_occupation" TEXT,
  ADD COLUMN "father_occupation_type" TEXT,
  ADD COLUMN "father_mobile" TEXT,
  ADD COLUMN "mother_name" TEXT,
  ADD COLUMN "mother_nid" TEXT,
  ADD COLUMN "mother_occupation" TEXT,
  ADD COLUMN "mother_occupation_type" TEXT,
  ADD COLUMN "mother_mobile" TEXT,
  ADD COLUMN "dob" DATE,
  ADD COLUMN "birth_reg" TEXT,
  ADD COLUMN "blood_group" TEXT,
  ADD COLUMN "present_school" TEXT,
  ADD COLUMN "religion" TEXT,
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "session" TEXT DEFAULT '2026',
  ADD COLUMN "shift" TEXT,
  ADD COLUMN "photo" TEXT;
