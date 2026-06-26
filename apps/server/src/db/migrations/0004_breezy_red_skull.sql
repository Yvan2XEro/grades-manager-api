CREATE TABLE "course_sessions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_course_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"room" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_assignment_batches" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"mode" text NOT NULL,
	"scope_id" text,
	"fee_structure_id" text,
	"fee_structure_name" text NOT NULL,
	"assigned_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "read_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignment_batches" ADD CONSTRAINT "fee_assignment_batches_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignment_batches" ADD CONSTRAINT "fee_assignment_batches_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignment_batches" ADD CONSTRAINT "fee_assignment_batches_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_course_sessions_institution" ON "course_sessions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_course_sessions_class_course" ON "course_sessions" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_course_sessions_academic_year" ON "course_sessions" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_course_sessions_day" ON "course_sessions" USING btree ("institution_id","day_of_week");--> statement-breakpoint
CREATE INDEX "idx_fee_assignment_batches_institution" ON "fee_assignment_batches" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_fee_assignment_batches_created_at" ON "fee_assignment_batches" USING btree ("institution_id","created_at");