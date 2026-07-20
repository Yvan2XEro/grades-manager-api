ALTER TABLE "attendance_excuse_audit_logs" DROP CONSTRAINT "attendance_excuse_audit_logs_attendance_record_id_attendance_records_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ALTER COLUMN "attendance_record_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD COLUMN "attendance_session_id" text;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD COLUMN "student_id" text;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_attendance_session_id_attendance_sessions_id_fk" FOREIGN KEY ("attendance_session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_attendance_record_id_attendance_records_id_fk" FOREIGN KEY ("attendance_record_id") REFERENCES "public"."attendance_records"("id") ON DELETE set null ON UPDATE no action;