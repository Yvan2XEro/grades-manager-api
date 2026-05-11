CREATE TABLE "batch_job_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"step_id" text,
	"level" text DEFAULT 'info' NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_job_steps" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"step_index" integer NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"items_total" integer DEFAULT 0,
	"items_processed" integer DEFAULT 0,
	"items_skipped" integer DEFAULT 0,
	"items_failed" integer DEFAULT 0,
	"error" text,
	"data" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "batch_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"type" text NOT NULL,
	"params" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"preview_result" jsonb,
	"previewed_at" timestamp with time zone,
	"execution_result" jsonb,
	"progress" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"rolled_back_at" timestamp with time zone,
	"error" text,
	"suggested_actions" jsonb,
	"parent_job_id" text,
	"rollback_job_id" text,
	"created_by" text,
	"last_heartbeat" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "center_administrative_instances" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"name_fr" text NOT NULL,
	"name_en" text NOT NULL,
	"acronym_fr" text,
	"acronym_en" text,
	"logo_url" text,
	"logo_svg" text,
	"show_on_transcripts" boolean DEFAULT true NOT NULL,
	"show_on_certificates" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "center_legal_texts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"text_fr" text NOT NULL,
	"text_en" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "centers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"code" text NOT NULL,
	"short_name" text,
	"name" text NOT NULL,
	"name_en" text,
	"description" text,
	"address_fr" text,
	"address_en" text,
	"city" text,
	"country" text,
	"postal_box" text,
	"contact_email" text,
	"contact_phone" text,
	"logo_url" text,
	"logo_svg" text,
	"admin_instance_logo_url" text,
	"admin_instance_logo_svg" text,
	"watermark_logo_url" text,
	"watermark_logo_svg" text,
	"authorization_order_fr" text,
	"authorization_order_en" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_centers_code_institution" UNIQUE("code","institution_id")
);
--> statement-breakpoint
CREATE TABLE "class_export_templates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_id" text NOT NULL,
	"template_type" text NOT NULL,
	"template_id" text NOT NULL,
	"theme_overrides" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "uq_class_export_templates_class_type" UNIQUE("class_id","template_type")
);
--> statement-breakpoint
CREATE TABLE "deliberation_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deliberation_id" text NOT NULL,
	"action" text NOT NULL,
	"actor_id" text,
	"student_id" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliberation_rules" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"program_id" text,
	"cycle_level_id" text,
	"deliberation_type" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"ruleset" jsonb NOT NULL,
	"decision" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliberation_student_results" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deliberation_id" text NOT NULL,
	"student_id" text NOT NULL,
	"general_average" double precision,
	"total_credits_earned" integer DEFAULT 0 NOT NULL,
	"total_credits_possible" integer DEFAULT 0 NOT NULL,
	"ue_results" jsonb DEFAULT '[]'::jsonb,
	"auto_decision" text,
	"final_decision" text,
	"is_overridden" boolean DEFAULT false NOT NULL,
	"override_reason" text,
	"overridden_by" text,
	"rank" integer,
	"mention" text,
	"rules_evaluated" jsonb DEFAULT '[]'::jsonb,
	"facts_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_deliberation_student_result" UNIQUE("deliberation_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "deliberations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_id" text NOT NULL,
	"semester_id" text,
	"academic_year_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"president_id" text,
	"jury_members" jsonb DEFAULT '[]'::jsonb,
	"deliberation_date" timestamp with time zone,
	"stats" jsonb,
	"opened_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"jury_number" text,
	"signed_at" timestamp with time zone,
	"signed_by" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_deliberation_class_semester_year_type" UNIQUE("institution_id","class_id","semester_id","academic_year_id","type")
);
--> statement-breakpoint
CREATE TABLE "diplomation_api_call_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" text,
	"institution_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"method" text NOT NULL,
	"status_code" integer,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diplomation_api_keys" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"key_hash" text NOT NULL,
	"label" text NOT NULL,
	"webhook_url" text,
	"webhook_secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diplomation_documents" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"source_id" text NOT NULL,
	"document_type" text NOT NULL,
	"student_id" text,
	"generated_at" timestamp with time zone NOT NULL,
	"file_reference" text,
	"generated_by_api_key_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_access_grants" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"granted_by_profile_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_grade_access_grant" UNIQUE("institution_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "program_export_templates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text NOT NULL,
	"template_type" text NOT NULL,
	"template_id" text NOT NULL,
	"theme_overrides" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_program_export_templates_program_type" UNIQUE("program_id","template_type")
);
--> statement-breakpoint
CREATE TABLE "retake_overrides" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"student_course_enrollment_id" text NOT NULL,
	"decision" text NOT NULL,
	"reason" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_retake_override_exam_enrollment" UNIQUE("exam_id","student_course_enrollment_id")
);
--> statement-breakpoint
ALTER TABLE "class_courses" DROP CONSTRAINT "uq_class_courses_code";--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "uq_courses_name_program";--> statement-breakpoint
ALTER TABLE "domain_users" DROP CONSTRAINT "uq_domain_users_email";--> statement-breakpoint
DROP INDEX "idx_domain_users_role";--> statement-breakpoint
ALTER TABLE "class_courses" ADD COLUMN "coefficient" numeric(5, 2) DEFAULT '1.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "total_credits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD COLUMN "type" text DEFAULT 'mandatory' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "default_coefficient" numeric(5, 2) DEFAULT '1.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_types" ADD COLUMN "default_percentage" integer DEFAULT 40;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "session_type" text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "parent_exam_id" text;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "scoring_policy" text DEFAULT 'replace' NOT NULL;--> statement-breakpoint
ALTER TABLE "export_templates" ADD COLUMN "is_system_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "export_templates" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "export_templates" ADD COLUMN "variant" text DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "export_templates" ADD COLUMN "theme_defaults" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "logo_svg" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "abbreviation" text;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "is_main" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "abbreviation" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "domain_fr" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "domain_en" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "specialite_fr" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "specialite_en" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "diploma_title_fr" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "diploma_title_en" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "attestation_validity_fr" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "attestation_validity_en" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "cycle_id" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "center_id" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "is_center_program" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "study_cycles" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "batch_job_logs" ADD CONSTRAINT "batch_job_logs_job_id_batch_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."batch_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_logs" ADD CONSTRAINT "batch_job_logs_step_id_batch_job_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."batch_job_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_steps" ADD CONSTRAINT "batch_job_steps_job_id_batch_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."batch_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_jobs" ADD CONSTRAINT "batch_jobs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_jobs" ADD CONSTRAINT "batch_jobs_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_administrative_instances" ADD CONSTRAINT "center_administrative_instances_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_legal_texts" ADD CONSTRAINT "center_legal_texts_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centers" ADD CONSTRAINT "centers_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_template_id_export_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."export_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_updated_by_domain_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberation_logs" ADD CONSTRAINT "deliberation_logs_deliberation_id_deliberations_id_fk" FOREIGN KEY ("deliberation_id") REFERENCES "public"."deliberations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberation_logs" ADD CONSTRAINT "deliberation_logs_actor_id_domain_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberation_logs" ADD CONSTRAINT "deliberation_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberation_rules" ADD CONSTRAINT "deliberation_rules_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberation_rules" ADD CONSTRAINT "deliberation_rules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberation_rules" ADD CONSTRAINT "deliberation_rules_cycle_level_id_cycle_levels_id_fk" FOREIGN KEY ("cycle_level_id") REFERENCES "public"."cycle_levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberation_student_results" ADD CONSTRAINT "deliberation_student_results_deliberation_id_deliberations_id_fk" FOREIGN KEY ("deliberation_id") REFERENCES "public"."deliberations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberation_student_results" ADD CONSTRAINT "deliberation_student_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberation_student_results" ADD CONSTRAINT "deliberation_student_results_overridden_by_domain_users_id_fk" FOREIGN KEY ("overridden_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberations" ADD CONSTRAINT "deliberations_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberations" ADD CONSTRAINT "deliberations_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberations" ADD CONSTRAINT "deliberations_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberations" ADD CONSTRAINT "deliberations_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberations" ADD CONSTRAINT "deliberations_president_id_domain_users_id_fk" FOREIGN KEY ("president_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberations" ADD CONSTRAINT "deliberations_signed_by_domain_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliberations" ADD CONSTRAINT "deliberations_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_api_call_logs" ADD CONSTRAINT "diplomation_api_call_logs_api_key_id_diplomation_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."diplomation_api_keys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_api_call_logs" ADD CONSTRAINT "diplomation_api_call_logs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_api_keys" ADD CONSTRAINT "diplomation_api_keys_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_documents" ADD CONSTRAINT "diplomation_documents_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_documents" ADD CONSTRAINT "diplomation_documents_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomation_documents" ADD CONSTRAINT "diplomation_documents_generated_by_api_key_id_diplomation_api_keys_id_fk" FOREIGN KEY ("generated_by_api_key_id") REFERENCES "public"."diplomation_api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_access_grants" ADD CONSTRAINT "grade_access_grants_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_access_grants" ADD CONSTRAINT "grade_access_grants_profile_id_domain_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."domain_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_access_grants" ADD CONSTRAINT "grade_access_grants_granted_by_profile_id_domain_users_id_fk" FOREIGN KEY ("granted_by_profile_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD CONSTRAINT "program_export_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD CONSTRAINT "program_export_templates_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD CONSTRAINT "program_export_templates_template_id_export_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."export_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_student_course_enrollment_id_student_course_enrollments_id_fk" FOREIGN KEY ("student_course_enrollment_id") REFERENCES "public"."student_course_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_batch_job_logs_job" ON "batch_job_logs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_batch_job_logs_step" ON "batch_job_logs" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "idx_batch_job_steps_job" ON "batch_job_steps" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_batch_jobs_institution_status" ON "batch_jobs" USING btree ("institution_id","status");--> statement-breakpoint
CREATE INDEX "idx_batch_jobs_type_status" ON "batch_jobs" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "idx_batch_jobs_scope_lock" ON "batch_jobs" USING btree ("institution_id","type","status");--> statement-breakpoint
CREATE INDEX "idx_center_admin_instances_center" ON "center_administrative_instances" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "idx_center_admin_instances_order" ON "center_administrative_instances" USING btree ("center_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_center_legal_texts_center" ON "center_legal_texts" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "idx_center_legal_texts_order" ON "center_legal_texts" USING btree ("center_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_centers_institution_id" ON "centers" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_class_export_templates_class" ON "class_export_templates" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_class_export_templates_template" ON "class_export_templates" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_deliberation_logs_deliberation" ON "deliberation_logs" USING btree ("deliberation_id");--> statement-breakpoint
CREATE INDEX "idx_deliberation_logs_action" ON "deliberation_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_deliberation_rules_institution" ON "deliberation_rules" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_deliberation_rules_category" ON "deliberation_rules" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_deliberation_rules_program" ON "deliberation_rules" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_deliberation_rules_cycle_level" ON "deliberation_rules" USING btree ("cycle_level_id");--> statement-breakpoint
CREATE INDEX "idx_deliberation_rules_type" ON "deliberation_rules" USING btree ("deliberation_type");--> statement-breakpoint
CREATE INDEX "idx_deliberation_rules_active" ON "deliberation_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_deliberation_rules_priority" ON "deliberation_rules" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_deliberation_results_deliberation" ON "deliberation_student_results" USING btree ("deliberation_id");--> statement-breakpoint
CREATE INDEX "idx_deliberation_results_student" ON "deliberation_student_results" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_deliberations_institution" ON "deliberations" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_deliberations_class" ON "deliberations" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_deliberations_year" ON "deliberations" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_deliberations_status" ON "deliberations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_deliberations_type" ON "deliberations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_diplomation_call_logs_key" ON "diplomation_api_call_logs" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "idx_diplomation_call_logs_institution" ON "diplomation_api_call_logs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diplomation_call_logs_called_at" ON "diplomation_api_call_logs" USING btree ("called_at");--> statement-breakpoint
CREATE INDEX "idx_diplomation_api_keys_institution" ON "diplomation_api_keys" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diplomation_api_keys_hash" ON "diplomation_api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_diplomation_documents_institution" ON "diplomation_documents" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diplomation_documents_source" ON "diplomation_documents" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_grade_access_grants_institution" ON "grade_access_grants" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_grade_access_grants_profile" ON "grade_access_grants" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_program_export_templates_program" ON "program_export_templates" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_program_export_templates_template" ON "program_export_templates" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_institution" ON "retake_overrides" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_exam" ON "retake_overrides" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_enrollment" ON "retake_overrides" USING btree ("student_course_enrollment_id");--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_cycle_id_study_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."study_cycles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exams_session_type" ON "exams" USING btree ("session_type");--> statement-breakpoint
CREATE INDEX "idx_exams_parent_exam_id" ON "exams" USING btree ("parent_exam_id");--> statement-breakpoint
CREATE INDEX "idx_programs_center_id" ON "programs" USING btree ("center_id");--> statement-breakpoint
ALTER TABLE "class_courses" DROP COLUMN "weekly_hours";--> statement-breakpoint
ALTER TABLE "domain_users" DROP COLUMN "business_role";--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "uq_class_courses_code" UNIQUE("code","class_id");