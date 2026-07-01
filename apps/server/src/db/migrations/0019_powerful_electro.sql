ALTER TABLE "notifications" ADD COLUMN "attempt_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "last_error" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "next_retry_at" timestamp with time zone;