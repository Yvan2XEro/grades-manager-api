CREATE TABLE IF NOT EXISTS "semesters" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"order_index" integer NOT NULL,
	CONSTRAINT "uq_semesters_code" UNIQUE("code")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_semesters_order" ON "semesters" ("order_index");
--> statement-breakpoint
INSERT INTO "semesters" ("code", "name", "order_index")
VALUES
	('S1', 'Semester 1', 1),
	('S2', 'Semester 2', 2)
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "faculties" ADD COLUMN IF NOT EXISTS "code" text;
--> statement-breakpoint
UPDATE "faculties"
SET "code" = COALESCE(
	"code",
	upper(concat('FAC-', right(gen_random_uuid()::text, 6)))
)
WHERE trim(COALESCE("code", '')) = '';
--> statement-breakpoint
ALTER TABLE "faculties" ALTER COLUMN "code" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "faculties" ADD CONSTRAINT "uq_faculties_code" UNIQUE("code");
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "code" text;
--> statement-breakpoint
UPDATE "programs"
SET "code" = COALESCE(
	"code",
	upper(substr(COALESCE("name", 'PRG'), 1, 4)) || '-' ||
	upper(right(gen_random_uuid()::text, 4))
)
WHERE trim(COALESCE("code", '')) = '';
--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "code" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "programs"
		ADD CONSTRAINT "uq_programs_code_faculty" UNIQUE("code", "faculty_id");
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "code" text;
--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "semester_id" text;
--> statement-breakpoint
UPDATE "classes"
SET "code" = COALESCE(
	"code",
	upper(substr(COALESCE("name", 'CLS'), 1, 6)) || '-' ||
	upper(right(gen_random_uuid()::text, 4))
)
WHERE trim(COALESCE("code", '')) = '';
--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "code" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "classes"
		ADD CONSTRAINT "uq_classes_code_year" UNIQUE("code", "academic_year_id");
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "classes"
		ADD CONSTRAINT "classes_semester_id_semesters_id_fk"
		FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id")
		ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_classes_semester_id" ON "classes" ("semester_id");
--> statement-breakpoint
WITH fallback AS (
	SELECT "id" FROM "semesters" ORDER BY "order_index" LIMIT 1
)
UPDATE "classes"
SET "semester_id" = (SELECT "id" FROM fallback)
WHERE "semester_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "code" text;
--> statement-breakpoint
UPDATE "courses"
SET "code" = COALESCE(
	"code",
	upper(substr(COALESCE("name", 'CRS'), 1, 4)) || '-' ||
	upper(right(gen_random_uuid()::text, 4))
)
WHERE trim(COALESCE("code", '')) = '';
--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "code" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "courses"
		ADD CONSTRAINT "uq_courses_code_program" UNIQUE("code", "program_id");
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "class_courses" ADD COLUMN IF NOT EXISTS "code" text;
--> statement-breakpoint
ALTER TABLE "class_courses" ADD COLUMN IF NOT EXISTS "semester_id" text;
--> statement-breakpoint
UPDATE "class_courses"
SET "code" = COALESCE(
	"code",
	upper(concat('CC-', right(gen_random_uuid()::text, 8)))
)
WHERE trim(COALESCE("code", '')) = '';
--> statement-breakpoint
ALTER TABLE "class_courses" ALTER COLUMN "code" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "class_courses"
		ADD CONSTRAINT "uq_class_courses_code" UNIQUE("code");
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	ALTER TABLE "class_courses"
		ADD CONSTRAINT "class_courses_semester_id_semesters_id_fk"
		FOREIGN KEY ("semester_id") REFERENCES "semesters" ("id")
		ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_class_courses_semester_id"
	ON "class_courses" ("semester_id");
--> statement-breakpoint
WITH fallback AS (
	SELECT "id" FROM "semesters" ORDER BY "order_index" LIMIT 1
)
UPDATE "class_courses" AS cc
SET "semester_id" = COALESCE(
	cc."semester_id",
	(SELECT "semester_id" FROM "classes" WHERE "id" = cc."class_id"),
	(SELECT "id" FROM fallback)
)
WHERE cc."semester_id" IS NULL;
