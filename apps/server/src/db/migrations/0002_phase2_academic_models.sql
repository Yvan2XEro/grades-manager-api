CREATE TABLE "teaching_units" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"credits" integer DEFAULT 0 NOT NULL,
	"semester" text DEFAULT 'annual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_teaching_units_program_code" UNIQUE("program_id","code")
);
--> statement-breakpoint
ALTER TABLE "teaching_units" ADD CONSTRAINT "teaching_units_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "teaching_unit_id" text;
--> statement-breakpoint
WITH program_units AS (
	SELECT
		p.id AS program_id,
		gen_random_uuid() AS unit_id,
		concat('Core Unit ', left(p.name, 20)) AS unit_name,
		concat('UE-', left(p.id, 8)) AS unit_code
	FROM programs p
)
INSERT INTO teaching_units (id, program_id, name, code, credits, semester)
SELECT unit_id, program_id, unit_name, unit_code, 0, 'annual'
FROM program_units;
--> statement-breakpoint
UPDATE courses
SET teaching_unit_id = (
	SELECT tu.id
	FROM teaching_units tu
	WHERE tu.program_id = courses.program_id
	LIMIT 1
);
--> statement-breakpoint
ALTER TABLE "courses" ALTER COLUMN "teaching_unit_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_teaching_unit_id_teaching_units_id_fk" FOREIGN KEY ("teaching_unit_id") REFERENCES "public"."teaching_units"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_courses_teaching_unit_id" ON "courses" USING btree ("teaching_unit_id");
--> statement-breakpoint
ALTER TABLE "class_courses" ADD COLUMN "weekly_hours" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE class_courses
SET weekly_hours = LEAST(GREATEST(c.hours, 1), 60)
FROM courses c
WHERE class_courses.course_id = c.id;
--> statement-breakpoint
CREATE TABLE "course_prerequisites" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" text NOT NULL,
	"prerequisite_course_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_course_prereq_pair" UNIQUE("course_id","prerequisite_course_id")
);
--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisite_course_id_courses_id_fk" FOREIGN KEY ("prerequisite_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_course_prereq_course" ON "course_prerequisites" USING btree ("course_id");
--> statement-breakpoint
CREATE INDEX "idx_course_prereq_requirement" ON "course_prerequisites" USING btree ("prerequisite_course_id");
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"exited_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_enrollments_student_id" ON "enrollments" USING btree ("student_id");
--> statement-breakpoint
CREATE INDEX "idx_enrollments_class_id" ON "enrollments" USING btree ("class_id");
--> statement-breakpoint
CREATE INDEX "idx_enrollments_year_id" ON "enrollments" USING btree ("academic_year_id");
--> statement-breakpoint
INSERT INTO enrollments (id, student_id, class_id, academic_year_id, status)
SELECT
	gen_random_uuid(),
	s.id,
	s.class_id,
	c.academic_year_id,
	'active'
FROM students s
JOIN classes c ON c.id = s.class_id
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "scheduled_by" text;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "validated_by" text;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "scheduled_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "validated_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_scheduled_by_domain_users_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_validated_by_domain_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;
