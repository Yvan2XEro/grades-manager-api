CREATE TABLE "class_export_templates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_id" text NOT NULL,
	"template_type" text NOT NULL,
	"template_id" text NOT NULL,
	"theme_overrides" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "uq_class_export_templates_class_type" UNIQUE("class_id","template_type")
);
--> statement-breakpoint
ALTER TABLE "center_administrative_instances" ADD COLUMN "logo_svg" text;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "logo_svg" text;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "admin_instance_logo_svg" text;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "watermark_logo_svg" text;--> statement-breakpoint
ALTER TABLE "export_templates" ADD COLUMN "is_system_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "export_templates" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "export_templates" ADD COLUMN "variant" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "export_templates" ADD COLUMN "theme_defaults" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "logo_svg" text;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD COLUMN "theme_overrides" jsonb;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_template_id_export_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."export_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_updated_by_domain_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_class_export_templates_class" ON "class_export_templates" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_class_export_templates_template" ON "class_export_templates" USING btree ("template_id");