CREATE TABLE "attendance_excuse_audit_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"attendance_record_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_exemption_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_course_id" text NOT NULL,
	"student_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_attendance_record_id_attendance_records_id_fk" FOREIGN KEY ("attendance_record_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_actor_id_domain_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemption_logs" ADD CONSTRAINT "attendance_exemption_logs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemption_logs" ADD CONSTRAINT "attendance_exemption_logs_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemption_logs" ADD CONSTRAINT "attendance_exemption_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemption_logs" ADD CONSTRAINT "attendance_exemption_logs_actor_id_domain_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_excuse_audit_record" ON "attendance_excuse_audit_logs" USING btree ("attendance_record_id");--> statement-breakpoint
CREATE INDEX "idx_excuse_audit_institution" ON "attendance_excuse_audit_logs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exemption_log_cc_student" ON "attendance_exemption_logs" USING btree ("class_course_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_exemption_log_institution" ON "attendance_exemption_logs" USING btree ("institution_id");