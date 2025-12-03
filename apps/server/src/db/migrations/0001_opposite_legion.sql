ALTER TABLE "programs" DROP CONSTRAINT "programs_cycle_id_study_cycles_id_fk";
--> statement-breakpoint
DROP INDEX "idx_programs_cycle_id";
--> statement-breakpoint
ALTER TABLE "programs" DROP COLUMN "cycle_id";
