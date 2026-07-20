CREATE TABLE "attendance_exemptions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_course_id" text NOT NULL,
	"student_id" text NOT NULL,
	"reason" text NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_attendance_exemption" UNIQUE("class_course_id","student_id")
);
--> statement-breakpoint
ALTER TABLE "attendance_exemptions" ADD CONSTRAINT "attendance_exemptions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemptions" ADD CONSTRAINT "attendance_exemptions_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemptions" ADD CONSTRAINT "attendance_exemptions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemptions" ADD CONSTRAINT "attendance_exemptions_granted_by_domain_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attendance_exemption_institution" ON "attendance_exemptions" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_atten_session_exceptional" ON "attendance_sessions" USING btree ("class_course_id","session_date") WHERE "attendance_sessions"."course_session_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_atten_session_scheduled" ON "attendance_sessions" USING btree ("class_course_id","course_session_id","session_date") WHERE "attendance_sessions"."course_session_id" IS NOT NULL;