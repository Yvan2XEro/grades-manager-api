CREATE TABLE "centers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"description" text,
	"address_fr" text,
	"address_en" text,
	"city" text,
	"country" text,
	"contact_email" text,
	"contact_phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_centers_code_institution" UNIQUE("code","institution_id")
);
--> statement-breakpoint
CREATE TABLE "diplomation_api_call_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" text,
	"institution_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status_code" integer,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_export_templates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"template_type" text NOT NULL,
	"template_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_program_export_templates_program_type" UNIQUE("program_id","template_type")
);
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "uq_courses_name_program";--> statement-breakpoint
ALTER TABLE "deliberations" ADD COLUMN "jury_number" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "default_academic_year_id" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "registration_format_id" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "abbreviation" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "abbreviation" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "domain_fr" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "domain_en" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "specialite_fr" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "specialite_en" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "center_id" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "is_center_program" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "study_cycles" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "centers" ADD CONSTRAINT "centers_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_api_call_logs" ADD CONSTRAINT "diplomation_api_call_logs_api_key_id_diplomation_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."diplomation_api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_api_call_logs" ADD CONSTRAINT "diplomation_api_call_logs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD CONSTRAINT "program_export_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD CONSTRAINT "program_export_templates_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD CONSTRAINT "program_export_templates_template_id_export_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."export_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_centers_institution_id" ON "centers" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diplomation_call_logs_key" ON "diplomation_api_call_logs" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "idx_diplomation_call_logs_institution" ON "diplomation_api_call_logs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diplomation_call_logs_called_at" ON "diplomation_api_call_logs" USING btree ("called_at");--> statement-breakpoint
CREATE INDEX "idx_program_export_templates_program" ON "program_export_templates" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_program_export_templates_template" ON "program_export_templates" USING btree ("template_id");--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_default_academic_year_id_academic_years_id_fk" FOREIGN KEY ("default_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_registration_format_id_registration_number_formats_id_fk" FOREIGN KEY ("registration_format_id") REFERENCES "public"."registration_number_formats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_programs_center_id" ON "programs" USING btree ("center_id");