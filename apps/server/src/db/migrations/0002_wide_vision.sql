ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "chk_courses_credits";
--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "slug" text;
--> statement-breakpoint
UPDATE "programs"
SET "slug" = regexp_replace(lower(trim(coalesce("name", ''))), '[^a-z0-9]+', '-', 'g')
WHERE "slug" IS NULL;
--> statement-breakpoint
UPDATE "programs"
SET "slug" = concat('program-', left("id", 8))
WHERE ("slug" IS NULL OR "slug" = '');
--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "credits";
--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "uq_programs_slug_faculty" UNIQUE("slug","faculty_id");
