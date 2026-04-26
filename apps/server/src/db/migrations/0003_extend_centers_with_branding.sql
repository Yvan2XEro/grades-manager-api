CREATE TABLE "center_administrative_instances" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"name_fr" text NOT NULL,
	"name_en" text NOT NULL,
	"acronym_fr" text,
	"acronym_en" text,
	"logo_url" text,
	"show_on_transcripts" boolean DEFAULT true NOT NULL,
	"show_on_certificates" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "center_legal_texts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"text_fr" text NOT NULL,
	"text_en" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "short_name" text;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "postal_box" text;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "admin_instance_logo_url" text;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "watermark_logo_url" text;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "authorization_order_fr" text;--> statement-breakpoint
ALTER TABLE "centers" ADD COLUMN "authorization_order_en" text;--> statement-breakpoint
ALTER TABLE "center_administrative_instances" ADD CONSTRAINT "center_administrative_instances_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_legal_texts" ADD CONSTRAINT "center_legal_texts_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_center_admin_instances_center" ON "center_administrative_instances" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "idx_center_admin_instances_order" ON "center_administrative_instances" USING btree ("center_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_center_legal_texts_center" ON "center_legal_texts" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "idx_center_legal_texts_order" ON "center_legal_texts" USING btree ("center_id","order_index");