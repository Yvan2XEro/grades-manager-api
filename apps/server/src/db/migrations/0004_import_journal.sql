CREATE TABLE "import_journal_entries" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" text NOT NULL,
	"seq" integer NOT NULL,
	"table_name" text NOT NULL,
	"row_id" text NOT NULL,
	"action" text NOT NULL,
	"before" jsonb
);
--> statement-breakpoint
ALTER TABLE "import_journal_entries" ADD CONSTRAINT "import_journal_entries_job_id_batch_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."batch_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_import_journal_job" ON "import_journal_entries" USING btree ("job_id","seq");