WITH ranked_active_plans AS (
	SELECT id, row_number() OVER (
		PARTITION BY institution_id, source_academic_year_id, target_academic_year_id
		ORDER BY created_at ASC, id ASC
	) AS position
	FROM "academic_year_transitions"
	WHERE status IN ('draft', 'ready', 'pending_approval', 'approved', 'running')
)
UPDATE "academic_year_transitions"
SET status = 'stale', updated_at = now()
WHERE id IN (
	SELECT id FROM ranked_active_plans WHERE position > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_active_academic_year_transition" ON "academic_year_transitions" USING btree ("institution_id","source_academic_year_id","target_academic_year_id") WHERE "academic_year_transitions"."status" IN ('draft', 'ready', 'pending_approval', 'approved', 'running');
