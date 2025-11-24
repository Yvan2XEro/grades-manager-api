CREATE TABLE "academic_years" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_academic_years_dates" CHECK ("academic_years"."end_date" > "academic_years"."start_date")
);
--> statement-breakpoint
CREATE TABLE "class_courses" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" text NOT NULL,
	"course_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"weekly_hours" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_class_courses" UNIQUE("class_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"program_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_classes_name_program_year" UNIQUE("name","program_id","academic_year_id")
);
--> statement-breakpoint
CREATE TABLE "course_prerequisites" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" text NOT NULL,
	"prerequisite_course_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_course_prereq_pair" UNIQUE("course_id","prerequisite_course_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"credits" integer NOT NULL,
	"hours" integer NOT NULL,
	"program_id" text NOT NULL,
	"teaching_unit_id" text NOT NULL,
	"default_teacher_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_courses_name_program" UNIQUE("name","program_id"),
	CONSTRAINT "chk_courses_credits" CHECK ("courses"."credits" >= 0),
	CONSTRAINT "chk_courses_hours" CHECK ("courses"."hours" > 0)
);
--> statement-breakpoint
CREATE TABLE "domain_users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text,
	"business_role" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"primary_email" text NOT NULL,
	"phone" text,
	"date_of_birth" date,
	"place_of_birth" text,
	"gender" text,
	"nationality" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_domain_users_auth" UNIQUE("auth_user_id"),
	CONSTRAINT "uq_domain_users_email" UNIQUE("primary_email")
);
--> statement-breakpoint
CREATE TABLE "enrollment_windows" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"status" text DEFAULT 'closed' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now(),
	"closed_at" timestamp with time zone,
	CONSTRAINT "uq_enrollment_window_class_year" UNIQUE("class_id","academic_year_id")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"exited_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"class_course_id" text NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"scheduled_by" text,
	"validated_by" text,
	"scheduled_at" timestamp with time zone,
	"validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_exams_percentage" CHECK ("exams"."percentage" >= 0 AND "exams"."percentage" <= 100)
);
--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_faculties_name" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_grades_student_exam" UNIQUE("student_id","exam_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_id" text,
	"channel" text DEFAULT 'email' NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"faculty_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_programs_name_faculty" UNIQUE("name","faculty_id")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_user_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"class_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_students_registration" UNIQUE("registration_number"),
	CONSTRAINT "uq_students_domain_user" UNIQUE("domain_user_id")
);
--> statement-breakpoint
CREATE TABLE "teaching_units" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"credits" integer DEFAULT 0 NOT NULL,
	"semester" text DEFAULT 'annual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_teaching_units_program_code" UNIQUE("program_id","code")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"impersonated_by" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisite_course_id_courses_id_fk" FOREIGN KEY ("prerequisite_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_teaching_unit_id_teaching_units_id_fk" FOREIGN KEY ("teaching_unit_id") REFERENCES "public"."teaching_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_default_teacher_id_user_id_fk" FOREIGN KEY ("default_teacher_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_users" ADD CONSTRAINT "domain_users_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_windows" ADD CONSTRAINT "enrollment_windows_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_windows" ADD CONSTRAINT "enrollment_windows_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_scheduled_by_domain_users_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_validated_by_domain_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_domain_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_domain_user_id_domain_users_id_fk" FOREIGN KEY ("domain_user_id") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_units" ADD CONSTRAINT "teaching_units_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_impersonated_by_user_id_fk" FOREIGN KEY ("impersonated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_class_courses_class_id" ON "class_courses" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_course_id" ON "class_courses" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_teacher_id" ON "class_courses" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_classes_program_id" ON "classes" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_classes_academic_year_id" ON "classes" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_course_prereq_course" ON "course_prerequisites" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_prereq_requirement" ON "course_prerequisites" USING btree ("prerequisite_course_id");--> statement-breakpoint
CREATE INDEX "idx_courses_program_id" ON "courses" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_courses_teaching_unit_id" ON "courses" USING btree ("teaching_unit_id");--> statement-breakpoint
CREATE INDEX "idx_courses_default_teacher_id" ON "courses" USING btree ("default_teacher_id");--> statement-breakpoint
CREATE INDEX "idx_domain_users_role" ON "domain_users" USING btree ("business_role");--> statement-breakpoint
CREATE INDEX "idx_enrollment_window_status" ON "enrollment_windows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_enrollments_student_id" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_class_id" ON "enrollments" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_year_id" ON "enrollments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_exams_class_course_id" ON "exams" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_exams_date" ON "exams" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_grades_student_id" ON "grades" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_grades_exam_id" ON "grades" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient" ON "notifications" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_status" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_programs_faculty_id" ON "programs" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "idx_students_class_id" ON "students" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_students_domain_user_id" ON "students" USING btree ("domain_user_id");--> statement-breakpoint
CREATE INDEX "idx_teaching_units_program_id" ON "teaching_units" USING btree ("program_id");