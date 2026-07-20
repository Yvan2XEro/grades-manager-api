ALTER TABLE "grade_scales" DROP CONSTRAINT "grade_scales_institution_unique";--> statement-breakpoint
ALTER TABLE "grade_scales" ADD COLUMN "program_id" text;--> statement-breakpoint
ALTER TABLE "grade_scales" ADD CONSTRAINT "grade_scales_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "grade_scales_institution_only_unique" ON "grade_scales" USING btree ("institution_id") WHERE "grade_scales"."program_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "grade_scales_program_unique" ON "grade_scales" USING btree ("institution_id","program_id") WHERE "grade_scales"."program_id" IS NOT NULL;