CREATE TABLE "exam_schedule_runs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"exam_type_id" text NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"date_start" timestamp with time zone NOT NULL,
	"date_end" timestamp with time zone NOT NULL,
	"class_ids" jsonb NOT NULL,
	"class_count" integer NOT NULL,
	"class_course_count" integer NOT NULL,
	"created_count" integer NOT NULL,
	"skipped_count" integer NOT NULL,
	"duplicate_count" integer NOT NULL,
	"conflict_count" integer NOT NULL,
	"scheduled_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_scheduled_by_domain_users_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exam_schedule_runs_faculty" ON "exam_schedule_runs" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "idx_exam_schedule_runs_year" ON "exam_schedule_runs" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_exam_schedule_runs_type" ON "exam_schedule_runs" USING btree ("exam_type_id");