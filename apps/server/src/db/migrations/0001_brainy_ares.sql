CREATE TABLE "registration_number_counters" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"format_id" text NOT NULL,
	"scope_key" text NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_registration_counter_scope" UNIQUE("format_id","scope_key")
);
--> statement-breakpoint
CREATE TABLE "registration_number_formats" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"definition" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registration_number_counters" ADD CONSTRAINT "registration_number_counters_format_id_registration_number_formats_id_fk" FOREIGN KEY ("format_id") REFERENCES "public"."registration_number_formats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_registration_counter_format_id" ON "registration_number_counters" USING btree ("format_id");--> statement-breakpoint
CREATE INDEX "idx_registration_formats_active" ON "registration_number_formats" USING btree ("is_active");