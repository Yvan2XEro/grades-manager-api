CREATE TABLE "admission_applications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"applicant_id" text NOT NULL,
	"program_id" text NOT NULL,
	"class_id" text,
	"academic_year_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"personal_statement" text,
	"review_notes" text,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"converted_student_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"date_of_birth" text,
	"nationality" text,
	"previous_diploma" text,
	"previous_institution" text,
	"reference_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_applicants_reference_code" UNIQUE("reference_code")
);
--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_reviewed_by_id_domain_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_converted_student_id_students_id_fk" FOREIGN KEY ("converted_student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admission_applications_institution" ON "admission_applications" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_admission_applications_applicant" ON "admission_applications" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "idx_admission_applications_program" ON "admission_applications" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_admission_applications_year" ON "admission_applications" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_admission_applications_status" ON "admission_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_applicants_institution" ON "applicants" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_applicants_email" ON "applicants" USING btree ("institution_id","email");