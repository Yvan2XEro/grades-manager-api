CREATE TABLE "retake_overrides" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"institution_id" text NOT NULL REFERENCES "public"."institutions"("id") ON DELETE cascade,
	"exam_id" text NOT NULL REFERENCES "public"."exams"("id") ON DELETE cascade,
	"student_course_enrollment_id" text NOT NULL REFERENCES "public"."student_course_enrollments"("id") ON DELETE cascade,
	"decision" text NOT NULL,
	"reason" text NOT NULL,
	"created_by" text REFERENCES "public"."domain_users"("id") ON DELETE set null,
	"created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_retake_override_exam_enrollment"
	ON "retake_overrides" ("exam_id", "student_course_enrollment_id");
--> statement-breakpoint
CREATE INDEX "idx_retake_override_institution"
	ON "retake_overrides" ("institution_id");
--> statement-breakpoint
CREATE INDEX "idx_retake_override_exam"
	ON "retake_overrides" ("exam_id");
--> statement-breakpoint
CREATE INDEX "idx_retake_override_enrollment"
	ON "retake_overrides" ("student_course_enrollment_id");
