-- Distinguish "standard" vs "center" variants of system templates so the UI
-- can present the right options for a program based on its centerId.
ALTER TABLE "export_templates" ADD COLUMN "variant" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_export_templates_variant" ON "export_templates" USING btree ("variant");
