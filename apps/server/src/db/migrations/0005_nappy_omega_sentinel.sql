CREATE TABLE "student_course_enrollments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"class_course_id" text NOT NULL,
	"course_id" text NOT NULL,
	"source_class_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"credits_attempted" integer NOT NULL,
	"credits_earned" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "uq_student_course_attempt" UNIQUE("student_id","course_id","academic_year_id","attempt")
);
--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_source_class_id_classes_id_fk" FOREIGN KEY ("source_class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_student_course_student" ON "student_course_enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_course_class_course" ON "student_course_enrollments" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_student_course_course" ON "student_course_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_student_course_year" ON "student_course_enrollments" USING btree ("academic_year_id");