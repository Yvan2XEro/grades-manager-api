CREATE TABLE "batch_job_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"step_id" text,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_job_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"step_index" integer NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"items_total" integer DEFAULT 0,
	"items_processed" integer DEFAULT 0,
	"items_skipped" integer DEFAULT 0,
	"items_failed" integer DEFAULT 0,
	"error" text,
	"data" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "batch_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"type" text NOT NULL,
	"params" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"preview_result" jsonb,
	"previewed_at" timestamp with time zone,
	"execution_result" jsonb,
	"progress" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"rolled_back_at" timestamp with time zone,
	"error" text,
	"suggested_actions" jsonb,
	"parent_job_id" text,
	"rollback_job_id" text,
	"created_by" text,
	"last_heartbeat" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "batch_job_logs" ADD CONSTRAINT "batch_job_logs_job_id_batch_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."batch_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_logs" ADD CONSTRAINT "batch_job_logs_step_id_batch_job_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."batch_job_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_steps" ADD CONSTRAINT "batch_job_steps_job_id_batch_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."batch_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_jobs" ADD CONSTRAINT "batch_jobs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_jobs" ADD CONSTRAINT "batch_jobs_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_batch_job_logs_job" ON "batch_job_logs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_batch_job_logs_step" ON "batch_job_logs" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "idx_batch_job_steps_job" ON "batch_job_steps" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_batch_jobs_institution_status" ON "batch_jobs" USING btree ("institution_id","status");--> statement-breakpoint
CREATE INDEX "idx_batch_jobs_type_status" ON "batch_jobs" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "idx_batch_jobs_scope_lock" ON "batch_jobs" USING btree ("institution_id","type","status");