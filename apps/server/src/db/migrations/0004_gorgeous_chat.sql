ALTER TABLE "exams" ADD COLUMN "session_type" text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "parent_exam_id" text;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "scoring_policy" text DEFAULT 'replace' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_exams_session_type" ON "exams" USING btree ("session_type");--> statement-breakpoint
CREATE INDEX "idx_exams_parent_exam_id" ON "exams" USING btree ("parent_exam_id");
