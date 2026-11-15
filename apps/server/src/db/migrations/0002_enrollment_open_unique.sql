-- Keep the most recent open enrollment per student and year; close the older duplicates
UPDATE "enrollments" e SET "status" = 'withdrawn', "exited_at" = now()
WHERE e."status" in ('pending', 'active')
  AND EXISTS (
    SELECT 1 FROM "enrollments" o
    WHERE o."student_id" = e."student_id"
      AND o."academic_year_id" = e."academic_year_id"
      AND o."status" in ('pending', 'active')
      AND (o."enrolled_at", o."id") > (e."enrolled_at", e."id")
  );--> statement-breakpoint
CREATE UNIQUE INDEX "uq_enrollments_open_student_year" ON "enrollments" USING btree ("student_id","academic_year_id") WHERE "enrollments"."status" in ('pending', 'active');