CREATE TABLE "diplomation_api_keys" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"key_hash" text NOT NULL,
	"label" text NOT NULL,
	"webhook_url" text,
	"webhook_secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diplomation_documents" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"source_id" text NOT NULL,
	"document_type" text NOT NULL,
	"student_id" text,
	"generated_at" timestamp with time zone NOT NULL,
	"file_reference" text,
	"generated_by_api_key_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "diploma_title_fr" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "diploma_title_en" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "attestation_validity_fr" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "attestation_validity_en" text;--> statement-breakpoint
ALTER TABLE "diplomation_api_keys" ADD CONSTRAINT "diplomation_api_keys_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_documents" ADD CONSTRAINT "diplomation_documents_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_documents" ADD CONSTRAINT "diplomation_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_documents" ADD CONSTRAINT "diplomation_documents_generated_by_api_key_id_diplomation_api_keys_id_fk" FOREIGN KEY ("generated_by_api_key_id") REFERENCES "public"."diplomation_api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_diplomation_api_keys_institution" ON "diplomation_api_keys" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diplomation_api_keys_hash" ON "diplomation_api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_diplomation_documents_institution" ON "diplomation_documents" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diplomation_documents_source" ON "diplomation_documents" USING btree ("source_id");
