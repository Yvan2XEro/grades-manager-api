DROP INDEX "idx_applicants_email";--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "uq_applicants_institution_email" UNIQUE("institution_id","email");