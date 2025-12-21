ALTER TABLE "institutions" ADD COLUMN "type" text DEFAULT 'institution' NOT NULL;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "parent_institution_id" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "faculty_id" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_parent_institution_id_institutions_id_fk" FOREIGN KEY ("parent_institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE set null ON UPDATE no action;