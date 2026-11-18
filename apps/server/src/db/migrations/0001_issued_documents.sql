CREATE TABLE "issued_documents" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"kind" text NOT NULL,
	"issue_year" integer NOT NULL,
	"sequence" integer NOT NULL,
	"reference_number" text NOT NULL,
	"class_id" text,
	"academic_year_id" text,
	"issued_by" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_issued_documents_sequence" UNIQUE("institution_id","kind","issue_year","sequence")
);
--> statement-breakpoint
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_documents" ADD CONSTRAINT "issued_documents_issued_by_domain_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_issued_documents_student" ON "issued_documents" USING btree ("student_id");