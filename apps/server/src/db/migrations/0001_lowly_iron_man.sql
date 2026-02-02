CREATE TABLE "retake_overrides" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"student_course_enrollment_id" text NOT NULL,
	"decision" text NOT NULL,
	"reason" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_retake_override_exam_enrollment" UNIQUE("exam_id","student_course_enrollment_id")
);
--> statement-breakpoint
ALTER TABLE "domain_users" DROP CONSTRAINT "uq_domain_users_email";--> statement-breakpoint
DROP INDEX "idx_domain_users_role";--> statement-breakpoint
ALTER TABLE "class_courses" ADD COLUMN "coefficient" numeric(5, 2) DEFAULT '1.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD COLUMN "type" text DEFAULT 'mandatory' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "default_coefficient" numeric(5, 2) DEFAULT '1.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_types" ADD COLUMN "default_percentage" integer DEFAULT 40;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "session_type" text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "parent_exam_id" text;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "scoring_policy" text DEFAULT 'replace' NOT NULL;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_student_course_enrollment_id_student_course_enrollments_id_fk" FOREIGN KEY ("student_course_enrollment_id") REFERENCES "public"."student_course_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_retake_override_institution" ON "retake_overrides" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_exam" ON "retake_overrides" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_enrollment" ON "retake_overrides" USING btree ("student_course_enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_exams_session_type" ON "exams" USING btree ("session_type");--> statement-breakpoint
CREATE INDEX "idx_exams_parent_exam_id" ON "exams" USING btree ("parent_exam_id");--> statement-breakpoint
ALTER TABLE "class_courses" DROP COLUMN "weekly_hours";--> statement-breakpoint
ALTER TABLE "domain_users" DROP COLUMN "business_role";