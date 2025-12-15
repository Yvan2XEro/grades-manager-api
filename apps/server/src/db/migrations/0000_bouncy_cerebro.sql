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
	"code" text NOT NULL,
	"class_id" text NOT NULL,
	"course_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"semester_id" text,
	"weekly_hours" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_class_courses" UNIQUE("class_id","course_id"),
	CONSTRAINT "uq_class_courses_code" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"program_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"semester_id" text,
	"cycle_level_id" text NOT NULL,
	"program_option_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_classes_name_program_year" UNIQUE("name","program_id","academic_year_id"),
	CONSTRAINT "uq_classes_code_year" UNIQUE("code","academic_year_id")
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
	"code" text NOT NULL,
	"name" text NOT NULL,
	"hours" integer NOT NULL,
	"program_id" text NOT NULL,
	"teaching_unit_id" text NOT NULL,
	"default_teacher_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_courses_name_program" UNIQUE("name","program_id"),
	CONSTRAINT "uq_courses_code_program" UNIQUE("code","program_id"),
	CONSTRAINT "chk_courses_hours" CHECK ("courses"."hours" > 0)
);
--> statement-breakpoint
CREATE TABLE "cycle_levels" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"min_credits" integer DEFAULT 60 NOT NULL,
	CONSTRAINT "uq_cycle_levels_code" UNIQUE("cycle_id","code"),
	CONSTRAINT "uq_cycle_levels_order" UNIQUE("cycle_id","order_index")
);
--> statement-breakpoint
CREATE TABLE "domain_users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text,
	"member_id" text,
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
	CONSTRAINT "uq_domain_users_member" UNIQUE("member_id"),
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
CREATE TABLE "exam_schedule_runs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"exam_type_id" text NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"date_start" timestamp with time zone NOT NULL,
	"date_end" timestamp with time zone NOT NULL,
	"class_ids" jsonb NOT NULL,
	"class_count" integer NOT NULL,
	"class_course_count" integer NOT NULL,
	"created_count" integer NOT NULL,
	"skipped_count" integer NOT NULL,
	"duplicate_count" integer NOT NULL,
	"conflict_count" integer NOT NULL,
	"scheduled_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_types" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_exam_types_name" UNIQUE("name")
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
	"schedule_run_id" text,
	"scheduled_at" timestamp with time zone,
	"validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_exams_percentage" CHECK ("exams"."percentage" >= 0 AND "exams"."percentage" <= 100)
);
--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_faculties_name" UNIQUE("name"),
	CONSTRAINT "uq_faculties_code" UNIQUE("code")
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
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"short_name" text,
	"name_fr" text NOT NULL,
	"name_en" text NOT NULL,
	"legal_name_fr" text,
	"legal_name_en" text,
	"slogan_fr" text,
	"slogan_en" text,
	"description_fr" text,
	"description_en" text,
	"address_fr" text,
	"address_en" text,
	"contact_email" text,
	"contact_phone" text,
	"fax" text,
	"postal_box" text,
	"website" text,
	"logo_url" text,
	"cover_image_url" text,
	"organization_id" text,
	"default_academic_year_id" text,
	"registration_format_id" text,
	"timezone" text DEFAULT 'UTC',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_institutions_code" UNIQUE("code")
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
CREATE TABLE "program_options" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_program_options_program_code" UNIQUE("program_id","code")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"faculty_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_programs_name_faculty" UNIQUE("name","faculty_id"),
	CONSTRAINT "uq_programs_code_faculty" UNIQUE("code","faculty_id"),
	CONSTRAINT "uq_programs_slug_faculty" UNIQUE("slug","faculty_id")
);
--> statement-breakpoint
CREATE TABLE "promotion_execution_results" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"execution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"was_promoted" boolean NOT NULL,
	"evaluation_data" jsonb NOT NULL,
	"rules_matched" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_promotion_results_execution_student" UNIQUE("execution_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "promotion_executions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" text NOT NULL,
	"source_class_id" text NOT NULL,
	"target_class_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"executed_by" text NOT NULL,
	"students_evaluated" integer DEFAULT 0 NOT NULL,
	"students_promoted" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_rules" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_class_id" text,
	"program_id" text,
	"cycle_level_id" text,
	"ruleset" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_number_counters" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"format_id" text NOT NULL,
	"scope_key" text NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_registration_counter_scope" UNIQUE("format_id","scope_key")
);
--> statement-breakpoint
CREATE TABLE "registration_number_formats" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"definition" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "semesters" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"order_index" integer NOT NULL,
	CONSTRAINT "uq_semesters_code" UNIQUE("code")
);
--> statement-breakpoint
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
CREATE TABLE "study_cycles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"total_credits_required" integer DEFAULT 180 NOT NULL,
	"duration_years" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_study_cycles_faculty_code" UNIQUE("faculty_id","code")
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_teacher_id_domain_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_cycle_level_id_cycle_levels_id_fk" FOREIGN KEY ("cycle_level_id") REFERENCES "public"."cycle_levels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_program_option_id_program_options_id_fk" FOREIGN KEY ("program_option_id") REFERENCES "public"."program_options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisite_course_id_courses_id_fk" FOREIGN KEY ("prerequisite_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_teaching_unit_id_teaching_units_id_fk" FOREIGN KEY ("teaching_unit_id") REFERENCES "public"."teaching_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_default_teacher_id_domain_users_id_fk" FOREIGN KEY ("default_teacher_id") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_levels" ADD CONSTRAINT "cycle_levels_cycle_id_study_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."study_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_users" ADD CONSTRAINT "domain_users_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_users" ADD CONSTRAINT "domain_users_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_windows" ADD CONSTRAINT "enrollment_windows_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_windows" ADD CONSTRAINT "enrollment_windows_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_scheduled_by_domain_users_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_scheduled_by_domain_users_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_validated_by_domain_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_schedule_run_id_exam_schedule_runs_id_fk" FOREIGN KEY ("schedule_run_id") REFERENCES "public"."exam_schedule_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_default_academic_year_id_academic_years_id_fk" FOREIGN KEY ("default_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_registration_format_id_registration_number_formats_id_fk" FOREIGN KEY ("registration_format_id") REFERENCES "public"."registration_number_formats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_domain_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_options" ADD CONSTRAINT "program_options_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_execution_results" ADD CONSTRAINT "promotion_execution_results_execution_id_promotion_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."promotion_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_execution_results" ADD CONSTRAINT "promotion_execution_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_rule_id_promotion_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."promotion_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_source_class_id_classes_id_fk" FOREIGN KEY ("source_class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_target_class_id_classes_id_fk" FOREIGN KEY ("target_class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_executed_by_domain_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_source_class_id_classes_id_fk" FOREIGN KEY ("source_class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_cycle_level_id_cycle_levels_id_fk" FOREIGN KEY ("cycle_level_id") REFERENCES "public"."cycle_levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_number_counters" ADD CONSTRAINT "registration_number_counters_format_id_registration_number_formats_id_fk" FOREIGN KEY ("format_id") REFERENCES "public"."registration_number_formats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_source_class_id_classes_id_fk" FOREIGN KEY ("source_class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_credit_ledgers" ADD CONSTRAINT "student_credit_ledgers_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_credit_ledgers" ADD CONSTRAINT "student_credit_ledgers_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_domain_user_id_domain_users_id_fk" FOREIGN KEY ("domain_user_id") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_cycles" ADD CONSTRAINT "study_cycles_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_units" ADD CONSTRAINT "teaching_units_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_class_courses_class_id" ON "class_courses" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_course_id" ON "class_courses" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_teacher_id" ON "class_courses" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_semester_id" ON "class_courses" USING btree ("semester_id");--> statement-breakpoint
CREATE INDEX "idx_classes_program_id" ON "classes" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_classes_academic_year_id" ON "classes" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_classes_semester_id" ON "classes" USING btree ("semester_id");--> statement-breakpoint
CREATE INDEX "idx_classes_cycle_level_id" ON "classes" USING btree ("cycle_level_id");--> statement-breakpoint
CREATE INDEX "idx_classes_program_option_id" ON "classes" USING btree ("program_option_id");--> statement-breakpoint
CREATE INDEX "idx_course_prereq_course" ON "course_prerequisites" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_prereq_requirement" ON "course_prerequisites" USING btree ("prerequisite_course_id");--> statement-breakpoint
CREATE INDEX "idx_courses_program_id" ON "courses" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_courses_teaching_unit_id" ON "courses" USING btree ("teaching_unit_id");--> statement-breakpoint
CREATE INDEX "idx_courses_default_teacher_id" ON "courses" USING btree ("default_teacher_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_levels_cycle" ON "cycle_levels" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "idx_domain_users_role" ON "domain_users" USING btree ("business_role");--> statement-breakpoint
CREATE INDEX "idx_enrollment_window_status" ON "enrollment_windows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_enrollments_student_id" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_class_id" ON "enrollments" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_year_id" ON "enrollments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_exam_schedule_runs_faculty" ON "exam_schedule_runs" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "idx_exam_schedule_runs_year" ON "exam_schedule_runs" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_exam_schedule_runs_type" ON "exam_schedule_runs" USING btree ("exam_type_id");--> statement-breakpoint
CREATE INDEX "idx_exams_class_course_id" ON "exams" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_exams_date" ON "exams" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_grades_student_id" ON "grades" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_grades_exam_id" ON "grades" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient" ON "notifications" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_status" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_program_options_program_id" ON "program_options" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_programs_faculty_id" ON "programs" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_results_execution" ON "promotion_execution_results" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_results_student" ON "promotion_execution_results" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_results_promoted" ON "promotion_execution_results" USING btree ("was_promoted");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_rule" ON "promotion_executions" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_source_class" ON "promotion_executions" USING btree ("source_class_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_target_class" ON "promotion_executions" USING btree ("target_class_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_year" ON "promotion_executions" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_executor" ON "promotion_executions" USING btree ("executed_by");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_source_class" ON "promotion_rules" USING btree ("source_class_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_program" ON "promotion_rules" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_cycle_level" ON "promotion_rules" USING btree ("cycle_level_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_active" ON "promotion_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_registration_counter_format_id" ON "registration_number_counters" USING btree ("format_id");--> statement-breakpoint
CREATE INDEX "idx_registration_formats_active" ON "registration_number_formats" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_semesters_order" ON "semesters" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "idx_student_course_student" ON "student_course_enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_course_class_course" ON "student_course_enrollments" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_student_course_course" ON "student_course_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_student_course_year" ON "student_course_enrollments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_student_credit_ledgers_student" ON "student_credit_ledgers" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_credit_ledgers_year" ON "student_credit_ledgers" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_students_class_id" ON "students" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_students_domain_user_id" ON "students" USING btree ("domain_user_id");--> statement-breakpoint
CREATE INDEX "idx_study_cycles_faculty" ON "study_cycles" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "idx_teaching_units_program_id" ON "teaching_units" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");