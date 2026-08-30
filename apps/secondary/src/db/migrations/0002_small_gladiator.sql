ALTER TABLE "official_exam_registrations" ADD COLUMN "fee_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "official_exam_registrations" ADD COLUMN "fee_paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "official_exam_registrations" ADD COLUMN "fee_transaction_ref" varchar(100);--> statement-breakpoint
ALTER TABLE "official_exam_sessions" ADD COLUMN "series" varchar(10);