ALTER TABLE "attendance_excuse_audit_logs" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD COLUMN "justification_document_url" text;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "excuse_category" text;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD COLUMN "justification_document_url" text;