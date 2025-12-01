CREATE TABLE "student_credit_ledgers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"credits_in_progress" integer DEFAULT 0 NOT NULL,
	"credits_earned" integer DEFAULT 0 NOT NULL,
	"required_credits" integer DEFAULT 60 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_student_credit_ledgers_student_year" UNIQUE("student_id","academic_year_id")
);
--> statement-breakpoint
ALTER TABLE "student_credit_ledgers" ADD CONSTRAINT "student_credit_ledgers_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_credit_ledgers" ADD CONSTRAINT "student_credit_ledgers_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_student_credit_ledgers_student" ON "student_credit_ledgers" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_credit_ledgers_year" ON "student_credit_ledgers" USING btree ("academic_year_id");