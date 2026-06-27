CREATE TABLE "exam_audit_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"from_status" text NOT NULL,
	"to_status" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_audit_events" ADD CONSTRAINT "exam_audit_events_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_audit_events" ADD CONSTRAINT "exam_audit_events_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_audit_events" ADD CONSTRAINT "exam_audit_events_actor_id_domain_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exam_audit_events_exam" ON "exam_audit_events" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_exam_audit_events_institution" ON "exam_audit_events" USING btree ("institution_id");