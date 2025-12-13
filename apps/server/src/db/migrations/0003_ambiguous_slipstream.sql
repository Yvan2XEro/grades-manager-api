CREATE TABLE "institutions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"short_name" text,
	"name_fr" text NOT NULL,
	"name_en" text NOT NULL,
	"legal_name_fr" text,
	"legal_name_en" text,
	"slogan_fr" text,
	"slogan_en" text,
	"description_fr" text,
	"description_en" text,
	"address_fr" text,
	"address_en" text,
	"contact_email" text,
	"contact_phone" text,
	"fax" text,
	"postal_box" text,
	"website" text,
	"logo_url" text,
	"cover_image_url" text,
	"default_academic_year_id" text,
	"registration_format_id" text,
	"timezone" text DEFAULT 'UTC',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_institutions_code" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_default_academic_year_id_academic_years_id_fk" FOREIGN KEY ("default_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_registration_format_id_registration_number_formats_id_fk" FOREIGN KEY ("registration_format_id") REFERENCES "public"."registration_number_formats"("id") ON DELETE set null ON UPDATE no action;