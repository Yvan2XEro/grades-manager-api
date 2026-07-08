CREATE TABLE "admission_application_documents" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"application_id" text NOT NULL,
	"requirement_id" text,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_notes" text,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_admission_app_doc_code" UNIQUE("application_id","code")
);
--> statement-breakpoint
CREATE TABLE "admission_document_requirements" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"allowed_mime_types" jsonb DEFAULT '[]'::jsonb,
	"max_size_bytes" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_admission_doc_req_scope_code" UNIQUE("institution_id","program_id","code")
);
--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_application_id_admission_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."admission_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_requirement_id_admission_document_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."admission_document_requirements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_reviewed_by_id_domain_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_document_requirements" ADD CONSTRAINT "admission_document_requirements_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_document_requirements" ADD CONSTRAINT "admission_document_requirements_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admission_app_docs_application" ON "admission_application_documents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_admission_app_docs_institution" ON "admission_application_documents" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_admission_doc_req_institution" ON "admission_document_requirements" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_admission_doc_req_program" ON "admission_document_requirements" USING btree ("program_id");