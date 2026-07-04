-- Dedup annual deliberations (semester_id IS NULL) before creating the partial index.
-- The old UNIQUE constraint treated NULL != NULL so duplicates could exist.
-- Keep the oldest row per (institution_id, class_id, academic_year_id, type).
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY institution_id, class_id, academic_year_id, type
        ORDER BY created_at ASC, id ASC
    ) AS rn
    FROM "deliberations"
    WHERE semester_id IS NULL
)
DELETE FROM "deliberations" WHERE id IN (SELECT id FROM ranked WHERE rn > 1);--> statement-breakpoint
-- Dedup semester deliberations (semester_id IS NOT NULL) — should already be unique
-- but dedup defensively to mirror the annual step.
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY institution_id, class_id, semester_id, academic_year_id, type
        ORDER BY created_at ASC, id ASC
    ) AS rn
    FROM "deliberations"
    WHERE semester_id IS NOT NULL
)
DELETE FROM "deliberations" WHERE id IN (SELECT id FROM ranked WHERE rn > 1);--> statement-breakpoint
ALTER TABLE "deliberations" DROP CONSTRAINT "uq_deliberation_class_semester_year_type";--> statement-breakpoint
CREATE UNIQUE INDEX "uq_delib_no_semester" ON "deliberations" USING btree ("institution_id","class_id","academic_year_id","type") WHERE "deliberations"."semester_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_delib_with_semester" ON "deliberations" USING btree ("institution_id","class_id","semester_id","academic_year_id","type") WHERE "deliberations"."semester_id" IS NOT NULL;
