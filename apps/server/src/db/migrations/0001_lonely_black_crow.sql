ALTER TABLE "exam_types" DROP CONSTRAINT "uq_exam_types_name";--> statement-breakpoint
ALTER TABLE "faculties" DROP CONSTRAINT "uq_faculties_name";--> statement-breakpoint
ALTER TABLE "faculties" DROP CONSTRAINT "uq_faculties_code";--> statement-breakpoint
ALTER TABLE "academic_years" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "class_courses" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_types" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "faculties" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "program_options" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "registration_number_formats" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "institution_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_types" ADD CONSTRAINT "exam_types_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_options" ADD CONSTRAINT "program_options_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_number_formats" ADD CONSTRAINT "registration_number_formats_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_academic_years_institution" ON "academic_years" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_institution_id" ON "class_courses" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_classes_institution_id" ON "classes" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_institution_id" ON "enrollments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exam_types_institution_id" ON "exam_types" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exams_institution_id" ON "exams" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_faculties_institution" ON "faculties" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_program_options_institution_id" ON "program_options" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_programs_institution_id" ON "programs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_institution_id" ON "promotion_rules" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_registration_formats_institution_id" ON "registration_number_formats" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_students_institution_id" ON "students" USING btree ("institution_id");--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "uq_academic_years_institution_name" UNIQUE("institution_id","name");--> statement-breakpoint
ALTER TABLE "exam_types" ADD CONSTRAINT "uq_exam_types_name_institution" UNIQUE("institution_id","name");--> statement-breakpoint
ALTER TABLE "faculties" ADD CONSTRAINT "uq_faculties_name_institution" UNIQUE("institution_id","name");--> statement-breakpoint
ALTER TABLE "faculties" ADD CONSTRAINT "uq_faculties_code_institution" UNIQUE("institution_id","code");