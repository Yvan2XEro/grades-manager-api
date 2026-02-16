CREATE TABLE "batch_job_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"step_id" text,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_job_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"step_index" integer NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"items_total" integer DEFAULT 0,
	"items_processed" integer DEFAULT 0,
	"items_skipped" integer DEFAULT 0,
	"items_failed" integer DEFAULT 0,
	"error" text,
	"data" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "batch_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"type" text NOT NULL,
	"params" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"preview_result" jsonb,
	"previewed_at" timestamp with time zone,
	"execution_result" jsonb,
	"progress" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"rolled_back_at" timestamp with time zone,
	"error" text,
	"suggested_actions" jsonb,
	"parent_job_id" text,
	"rollback_job_id" text,
	"created_by" text,
	"last_heartbeat" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
ALTER TABLE "batch_job_logs" ADD CONSTRAINT "batch_job_logs_job_id_batch_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."batch_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_logs" ADD CONSTRAINT "batch_job_logs_step_id_batch_job_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."batch_job_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_steps" ADD CONSTRAINT "batch_job_steps_job_id_batch_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."batch_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_jobs" ADD CONSTRAINT "batch_jobs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_jobs" ADD CONSTRAINT "batch_jobs_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_student_course_enrollment_id_student_course_enrollments_id_fk" FOREIGN KEY ("student_course_enrollment_id") REFERENCES "public"."student_course_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_batch_job_logs_job" ON "batch_job_logs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_batch_job_logs_step" ON "batch_job_logs" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "idx_batch_job_steps_job" ON "batch_job_steps" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_batch_jobs_institution_status" ON "batch_jobs" USING btree ("institution_id","status");--> statement-breakpoint
CREATE INDEX "idx_batch_jobs_type_status" ON "batch_jobs" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "idx_batch_jobs_scope_lock" ON "batch_jobs" USING btree ("institution_id","type","status");--> statement-breakpoint
CREATE INDEX "idx_retake_override_institution" ON "retake_overrides" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_exam" ON "retake_overrides" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_enrollment" ON "retake_overrides" USING btree ("student_course_enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_exams_session_type" ON "exams" USING btree ("session_type");--> statement-breakpoint
CREATE INDEX "idx_exams_parent_exam_id" ON "exams" USING btree ("parent_exam_id");--> statement-breakpoint
ALTER TABLE "class_courses" DROP COLUMN "weekly_hours";--> statement-breakpoint
ALTER TABLE "domain_users" DROP COLUMN "business_role";