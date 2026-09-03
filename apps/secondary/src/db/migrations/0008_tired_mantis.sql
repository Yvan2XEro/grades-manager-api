CREATE TABLE "print_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"type" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"html_content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "print_templates" ADD CONSTRAINT "print_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "print_templates_institution_idx" ON "print_templates" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "print_templates_institution_type_idx" ON "print_templates" USING btree ("institution_id","type");