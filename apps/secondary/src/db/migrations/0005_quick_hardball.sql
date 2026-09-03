ALTER TABLE "institutions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "org_id" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_org_id_unique" UNIQUE("org_id");