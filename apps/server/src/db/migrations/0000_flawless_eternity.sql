CREATE TABLE "academic_year_transition_items" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"transition_id" text NOT NULL,
	"student_id" text NOT NULL,
	"source_enrollment_id" text NOT NULL,
	"deliberation_id" text,
	"deliberation_student_result_id" text,
	"decision" text,
	"proposed_outcome" text NOT NULL,
	"final_outcome" text NOT NULL,
	"proposed_target_class_id" text,
	"final_target_class_id" text,
	"status" text NOT NULL,
	"blocker_code" text,
	"blocker_details" jsonb DEFAULT '{}'::jsonb,
	"is_overridden" boolean DEFAULT false NOT NULL,
	"override_reason" text,
	"overridden_by" text,
	"overridden_at" timestamp with time zone,
	"target_enrollment_id" text,
	"processed_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_academic_year_transition_source_enrollment" UNIQUE("transition_id","source_enrollment_id")
);
--> statement-breakpoint
CREATE TABLE "academic_year_transitions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"source_academic_year_id" text NOT NULL,
	"target_academic_year_id" text NOT NULL,
	"scope_class_ids" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"deferred_outcome" text DEFAULT 'review' NOT NULL,
	"summary" jsonb DEFAULT '{}'::jsonb,
	"generated_by" text NOT NULL,
	"submitted_by" text,
	"approved_by" text,
	"executed_by" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_academic_year_transition_years" CHECK ("academic_year_transitions"."source_academic_year_id" <> "academic_year_transitions"."target_academic_year_id")
);
--> statement-breakpoint
CREATE TABLE "academic_years" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_academic_years_institution_name" UNIQUE("institution_id","name"),
	CONSTRAINT "chk_academic_years_dates" CHECK ("academic_years"."end_date" > "academic_years"."start_date")
);
--> statement-breakpoint
CREATE TABLE "admission_application_documents" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"application_id" text NOT NULL,
	"requirement_id" text,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_notes" text,
	"reviewed_by_id" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_admission_app_doc_code" UNIQUE("application_id","code")
);
--> statement-breakpoint
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
CREATE TABLE "admission_document_requirements" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"is_required" boolean DEFAULT true NOT NULL,
	"allowed_mime_types" jsonb DEFAULT '[]'::jsonb,
	"max_size_bytes" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_admission_doc_req_scope_code" UNIQUE("institution_id","program_id","code")
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
	CONSTRAINT "uq_applicants_reference_code" UNIQUE("reference_code"),
	CONSTRAINT "uq_applicants_institution_email" UNIQUE("institution_id","email")
);
--> statement-breakpoint
CREATE TABLE "attendance_excuse_audit_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"attendance_record_id" text,
	"attendance_session_id" text,
	"student_id" text,
	"action" text NOT NULL,
	"category" text,
	"reason" text NOT NULL,
	"justification_document_url" text,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_exemption_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_course_id" text NOT NULL,
	"student_id" text NOT NULL,
	"action" text NOT NULL,
	"reason" text,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_exemptions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_course_id" text NOT NULL,
	"student_id" text NOT NULL,
	"reason" text NOT NULL,
	"granted_by" text,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_attendance_exemption" UNIQUE("class_course_id","student_id")
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"attendance_session_id" text NOT NULL,
	"student_id" text NOT NULL,
	"status" text DEFAULT 'present' NOT NULL,
	"excuse_category" text,
	"excuse_reason" text,
	"justification_document_url" text,
	"excuse_approved_by" text,
	"excuse_approved_at" timestamp with time zone,
	"marked_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_attendance_record_session_student" UNIQUE("attendance_session_id","student_id"),
	CONSTRAINT "chk_attendance_record_status" CHECK ("attendance_records"."status" IN ('present', 'absent', 'late', 'excused'))
);
--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_course_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"course_session_id" text,
	"session_date" date NOT NULL,
	"notes" text,
	"is_exceptional" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "class_course_access_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_course_id" text NOT NULL,
	"actor_profile_id" text NOT NULL,
	"source" text NOT NULL,
	"is_delegate" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_courses" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"code" text NOT NULL,
	"class_id" text NOT NULL,
	"course_id" text NOT NULL,
	"teacher_id" text NOT NULL,
	"semester_id" text,
	"coefficient" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"attendance_threshold" integer,
	"attendance_excused_counts_as_absent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_class_courses" UNIQUE("class_id","course_id"),
	CONSTRAINT "uq_class_courses_code" UNIQUE("code","class_id"),
	CONSTRAINT "chk_class_course_attendance_threshold" CHECK ("class_courses"."attendance_threshold" IS NULL OR ("class_courses"."attendance_threshold" >= 0 AND "class_courses"."attendance_threshold" <= 100))
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
CREATE TABLE "classes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"program_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"semester_id" text,
	"cycle_level_id" text NOT NULL,
	"program_option_id" text NOT NULL,
	"total_credits" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_classes_name_program_year" UNIQUE("name","program_id","academic_year_id"),
	CONSTRAINT "uq_classes_code_year" UNIQUE("code","academic_year_id")
);
--> statement-breakpoint
CREATE TABLE "course_prerequisites" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" text NOT NULL,
	"prerequisite_course_id" text NOT NULL,
	"type" text DEFAULT 'mandatory' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_course_prereq_pair" UNIQUE("course_id","prerequisite_course_id")
);
--> statement-breakpoint
CREATE TABLE "course_sessions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"class_course_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"room" text,
	"room_id" text,
	"semester_id" text,
	"valid_from" date,
	"valid_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"default_coefficient" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "document_downloads" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"kind" text NOT NULL,
	"downloaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" text,
	"institution_id" text,
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
	CONSTRAINT "uq_domain_users_member" UNIQUE("member_id")
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
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"class_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"exited_at" timestamp with time zone,
	"admission_type" text DEFAULT 'normal' NOT NULL,
	"transfer_institution" text,
	"transfer_credits" integer DEFAULT 0,
	"transfer_level" text,
	"admission_justification" text,
	"admission_date" timestamp with time zone,
	"admission_metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "exam_audit_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"from_status" text NOT NULL,
	"to_status" text NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_grade_editors" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" text NOT NULL,
	"editor_profile_id" text NOT NULL,
	"granted_by_profile_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_exam_grade_editor" UNIQUE("exam_id","editor_profile_id")
);
--> statement-breakpoint
CREATE TABLE "exam_participation_rosters" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"exam_id" text NOT NULL,
	"student_id" text NOT NULL,
	"eligible" boolean DEFAULT true NOT NULL,
	"reason" text,
	"exempted" boolean DEFAULT false NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_schedule_runs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
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
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"default_percentage" integer DEFAULT 40,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_exam_types_name_institution" UNIQUE("institution_id","name")
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"class_course_id" text NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"session_type" text DEFAULT 'normal' NOT NULL,
	"parent_exam_id" text,
	"scoring_policy" text DEFAULT 'replace' NOT NULL,
	"scheduled_by" text,
	"validated_by" text,
	"schedule_run_id" text,
	"scheduled_at" timestamp with time zone,
	"validated_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_exams_percentage" CHECK ("exams"."percentage" >= 0 AND "exams"."percentage" <= 100)
);
--> statement-breakpoint
CREATE TABLE "export_templates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_system_default" boolean DEFAULT false NOT NULL,
	"description" text,
	"variant" text DEFAULT 'standard' NOT NULL,
	"template_body" text NOT NULL,
	"theme_defaults" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "uq_export_templates_institution_name" UNIQUE("institution_id","name")
);
--> statement-breakpoint
CREATE TABLE "fee_assignment_batches" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"mode" text NOT NULL,
	"scope_id" text,
	"fee_structure_id" text,
	"fee_structure_name" text NOT NULL,
	"assigned_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_gating_rules" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"gate" text NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "uq_fee_gating_rules_institution_gate" UNIQUE("institution_id","gate")
);
--> statement-breakpoint
CREATE TABLE "fee_payment_orders" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"fee_assignment_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"installment_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reference" text,
	"notes" text,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" text,
	"expires_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_fee_payment_orders_amount" CHECK ("fee_payment_orders"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "fee_payments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"fee_assignment_id" text NOT NULL,
	"payment_order_id" text,
	"installment_id" text,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"payment_date" date NOT NULL,
	"payment_method" text DEFAULT 'cash' NOT NULL,
	"reference" text,
	"notes" text,
	"recorded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_fee_payments_amount" CHECK ("fee_payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "fee_structure_installments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fee_structure_id" text NOT NULL,
	"label" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"due_date" date,
	"order_index" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uq_fee_installments_order" UNIQUE("fee_structure_id","order_index"),
	CONSTRAINT "chk_fee_installments_amount" CHECK ("fee_structure_installments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "fee_structures" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"program_id" text,
	"cycle_level_id" text,
	"name" text NOT NULL,
	"description" text,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "chk_fee_structures_amount" CHECK ("fee_structures"."total_amount" >= 0)
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
CREATE TABLE "grade_edit_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"exam_id" text,
	"class_course_id" text,
	"student_id" text,
	"grade_id" text,
	"actor_profile_id" text,
	"actor_role" text NOT NULL,
	"is_delegate" boolean DEFAULT false NOT NULL,
	"action" text NOT NULL,
	"score_before" numeric(5, 2),
	"score_after" numeric(5, 2),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_scales" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"program_id" text,
	"pass_threshold" numeric(5, 2) DEFAULT '10' NOT NULL,
	"compensation_threshold" numeric(5, 2) DEFAULT '8' NOT NULL,
	"mention_ranges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "guardian_communication_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"guardian_id" text NOT NULL,
	"student_id" text NOT NULL,
	"type" text NOT NULL,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"reason" text,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guardians" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"access_token" text NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_guardians_institution_email" UNIQUE("institution_id","email"),
	CONSTRAINT "uq_guardians_access_token" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"type" text DEFAULT 'institution' NOT NULL,
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
	"logo_svg" text,
	"cover_image_url" text,
	"parent_institution_id" text,
	"organization_id" text,
	"default_academic_year_id" text,
	"registration_format_id" text,
	"abbreviation" text,
	"is_main" boolean DEFAULT false NOT NULL,
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
	"read_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_retry_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "program_options" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
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
	"institution_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"abbreviation" text,
	"slug" text NOT NULL,
	"description" text,
	"domain_fr" text,
	"domain_en" text,
	"specialite_fr" text,
	"specialite_en" text,
	"diploma_title_fr" text,
	"diploma_title_en" text,
	"attestation_validity_fr" text,
	"attestation_validity_en" text,
	"cycle_id" text,
	"center_id" text,
	"is_center_program" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_programs_name_institution" UNIQUE("name","institution_id"),
	CONSTRAINT "uq_programs_code_institution" UNIQUE("code","institution_id"),
	CONSTRAINT "uq_programs_slug_institution" UNIQUE("slug","institution_id")
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
	"institution_id" text NOT NULL,
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
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"definition" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"capacity" integer,
	"building" text,
	"campus" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rooms_institution_code" UNIQUE("institution_id","code")
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
CREATE TABLE "student_fee_assignments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"fee_structure_id" text NOT NULL,
	"effective_amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_reason" text,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"cleared_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "uq_student_fee_assignments_student_year" UNIQUE("institution_id","student_id","academic_year_id"),
	CONSTRAINT "chk_student_fee_assignments_discount" CHECK ("student_fee_assignments"."discount_amount" >= 0 AND "student_fee_assignments"."discount_amount" <= "student_fee_assignments"."effective_amount")
);
--> statement-breakpoint
CREATE TABLE "student_guardians" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"guardian_id" text NOT NULL,
	"relationship_type" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_emergency_contact" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_student_guardians_pair" UNIQUE("student_id","guardian_id")
);
--> statement-breakpoint
CREATE TABLE "student_promotion_summaries" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text NOT NULL,
	"academic_year_id" text NOT NULL,
	"class_id" text NOT NULL,
	"program_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"class_name" text NOT NULL,
	"program_code" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"overall_average" double precision DEFAULT 0 NOT NULL,
	"overall_average_unweighted" double precision DEFAULT 0 NOT NULL,
	"success_rate" double precision DEFAULT 0 NOT NULL,
	"unit_validation_rate" double precision DEFAULT 0 NOT NULL,
	"credits_earned" integer DEFAULT 0 NOT NULL,
	"credits_earned_this_year" integer DEFAULT 0 NOT NULL,
	"credits_attempted" integer DEFAULT 0 NOT NULL,
	"credits_in_progress" integer DEFAULT 0 NOT NULL,
	"required_credits" integer DEFAULT 0 NOT NULL,
	"credit_completion_rate" double precision DEFAULT 0 NOT NULL,
	"credit_deficit" integer DEFAULT 0 NOT NULL,
	"credit_success_rate" double precision DEFAULT 0 NOT NULL,
	"performance_index" double precision DEFAULT 0 NOT NULL,
	"is_on_track" boolean DEFAULT false NOT NULL,
	"progression_rate" double precision DEFAULT 0 NOT NULL,
	"projected_credits_end_of_year" double precision DEFAULT 0 NOT NULL,
	"can_reach_required_credits" boolean DEFAULT false NOT NULL,
	"failed_teaching_units_count" integer DEFAULT 0 NOT NULL,
	"eliminatory_failures" integer DEFAULT 0 NOT NULL,
	"scores_below_8" integer DEFAULT 0 NOT NULL,
	"admission_type" text DEFAULT 'normal' NOT NULL,
	"is_transfer_student" boolean DEFAULT false NOT NULL,
	"is_direct_admission" boolean DEFAULT false NOT NULL,
	"has_academic_history" boolean DEFAULT false NOT NULL,
	"transfer_credits" integer DEFAULT 0 NOT NULL,
	"transfer_institution" text,
	"transfer_level" text,
	"averages_by_teaching_unit" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"averages_by_course" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"facts" jsonb NOT NULL,
	CONSTRAINT "uq_student_promotion_summary" UNIQUE("student_id","academic_year_id")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
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
	"institution_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"description" text,
	"total_credits_required" integer DEFAULT 180 NOT NULL,
	"duration_years" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_study_cycles_institution_code" UNIQUE("institution_id","code")
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
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_transition_id_academic_year_transitions_id_fk" FOREIGN KEY ("transition_id") REFERENCES "public"."academic_year_transitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_source_enrollment_id_enrollments_id_fk" FOREIGN KEY ("source_enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_deliberation_id_deliberations_id_fk" FOREIGN KEY ("deliberation_id") REFERENCES "public"."deliberations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_deliberation_student_result_id_deliberation_student_results_id_fk" FOREIGN KEY ("deliberation_student_result_id") REFERENCES "public"."deliberation_student_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_proposed_target_class_id_classes_id_fk" FOREIGN KEY ("proposed_target_class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_final_target_class_id_classes_id_fk" FOREIGN KEY ("final_target_class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_overridden_by_domain_users_id_fk" FOREIGN KEY ("overridden_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transition_items" ADD CONSTRAINT "academic_year_transition_items_target_enrollment_id_enrollments_id_fk" FOREIGN KEY ("target_enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transitions" ADD CONSTRAINT "academic_year_transitions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transitions" ADD CONSTRAINT "academic_year_transitions_source_academic_year_id_academic_years_id_fk" FOREIGN KEY ("source_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transitions" ADD CONSTRAINT "academic_year_transitions_target_academic_year_id_academic_years_id_fk" FOREIGN KEY ("target_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transitions" ADD CONSTRAINT "academic_year_transitions_generated_by_domain_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transitions" ADD CONSTRAINT "academic_year_transitions_submitted_by_domain_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transitions" ADD CONSTRAINT "academic_year_transitions_approved_by_domain_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_year_transitions" ADD CONSTRAINT "academic_year_transitions_executed_by_domain_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_application_id_admission_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."admission_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_requirement_id_admission_document_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."admission_document_requirements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_application_documents" ADD CONSTRAINT "admission_application_documents_reviewed_by_id_domain_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_reviewed_by_id_domain_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_converted_student_id_students_id_fk" FOREIGN KEY ("converted_student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_document_requirements" ADD CONSTRAINT "admission_document_requirements_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_document_requirements" ADD CONSTRAINT "admission_document_requirements_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_attendance_record_id_attendance_records_id_fk" FOREIGN KEY ("attendance_record_id") REFERENCES "public"."attendance_records"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_attendance_session_id_attendance_sessions_id_fk" FOREIGN KEY ("attendance_session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_excuse_audit_logs" ADD CONSTRAINT "attendance_excuse_audit_logs_actor_id_domain_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemption_logs" ADD CONSTRAINT "attendance_exemption_logs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemption_logs" ADD CONSTRAINT "attendance_exemption_logs_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemption_logs" ADD CONSTRAINT "attendance_exemption_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemption_logs" ADD CONSTRAINT "attendance_exemption_logs_actor_id_domain_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemptions" ADD CONSTRAINT "attendance_exemptions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemptions" ADD CONSTRAINT "attendance_exemptions_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemptions" ADD CONSTRAINT "attendance_exemptions_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_exemptions" ADD CONSTRAINT "attendance_exemptions_granted_by_domain_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_attendance_session_id_attendance_sessions_id_fk" FOREIGN KEY ("attendance_session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_excuse_approved_by_domain_users_id_fk" FOREIGN KEY ("excuse_approved_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_domain_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_course_session_id_course_sessions_id_fk" FOREIGN KEY ("course_session_id") REFERENCES "public"."course_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_logs" ADD CONSTRAINT "batch_job_logs_job_id_batch_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."batch_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_logs" ADD CONSTRAINT "batch_job_logs_step_id_batch_job_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."batch_job_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_job_steps" ADD CONSTRAINT "batch_job_steps_job_id_batch_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."batch_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_jobs" ADD CONSTRAINT "batch_jobs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_jobs" ADD CONSTRAINT "batch_jobs_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_administrative_instances" ADD CONSTRAINT "center_administrative_instances_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_legal_texts" ADD CONSTRAINT "center_legal_texts_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centers" ADD CONSTRAINT "centers_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_course_access_logs" ADD CONSTRAINT "class_course_access_logs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_course_access_logs" ADD CONSTRAINT "class_course_access_logs_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_course_access_logs" ADD CONSTRAINT "class_course_access_logs_actor_profile_id_domain_users_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."domain_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_teacher_id_domain_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_template_id_export_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."export_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_export_templates" ADD CONSTRAINT "class_export_templates_updated_by_domain_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_cycle_level_id_cycle_levels_id_fk" FOREIGN KEY ("cycle_level_id") REFERENCES "public"."cycle_levels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_program_option_id_program_options_id_fk" FOREIGN KEY ("program_option_id") REFERENCES "public"."program_options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisite_course_id_courses_id_fk" FOREIGN KEY ("prerequisite_course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_teaching_unit_id_teaching_units_id_fk" FOREIGN KEY ("teaching_unit_id") REFERENCES "public"."teaching_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_default_teacher_id_domain_users_id_fk" FOREIGN KEY ("default_teacher_id") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_levels" ADD CONSTRAINT "cycle_levels_cycle_id_study_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."study_cycles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE "document_downloads" ADD CONSTRAINT "document_downloads_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_downloads" ADD CONSTRAINT "document_downloads_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_users" ADD CONSTRAINT "domain_users_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain_users" ADD CONSTRAINT "domain_users_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_windows" ADD CONSTRAINT "enrollment_windows_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_windows" ADD CONSTRAINT "enrollment_windows_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_audit_events" ADD CONSTRAINT "exam_audit_events_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_audit_events" ADD CONSTRAINT "exam_audit_events_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_audit_events" ADD CONSTRAINT "exam_audit_events_actor_id_domain_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_grade_editors" ADD CONSTRAINT "exam_grade_editors_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_grade_editors" ADD CONSTRAINT "exam_grade_editors_editor_profile_id_domain_users_id_fk" FOREIGN KEY ("editor_profile_id") REFERENCES "public"."domain_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_grade_editors" ADD CONSTRAINT "exam_grade_editors_granted_by_profile_id_domain_users_id_fk" FOREIGN KEY ("granted_by_profile_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_participation_rosters" ADD CONSTRAINT "exam_participation_rosters_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_participation_rosters" ADD CONSTRAINT "exam_participation_rosters_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_participation_rosters" ADD CONSTRAINT "exam_participation_rosters_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_participation_rosters" ADD CONSTRAINT "exam_participation_rosters_locked_by_domain_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_exam_type_id_exam_types_id_fk" FOREIGN KEY ("exam_type_id") REFERENCES "public"."exam_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_schedule_runs" ADD CONSTRAINT "exam_schedule_runs_scheduled_by_domain_users_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_types" ADD CONSTRAINT "exam_types_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_scheduled_by_domain_users_id_fk" FOREIGN KEY ("scheduled_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_validated_by_domain_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_schedule_run_id_exam_schedule_runs_id_fk" FOREIGN KEY ("schedule_run_id") REFERENCES "public"."exam_schedule_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_templates" ADD CONSTRAINT "export_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_templates" ADD CONSTRAINT "export_templates_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_templates" ADD CONSTRAINT "export_templates_updated_by_domain_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignment_batches" ADD CONSTRAINT "fee_assignment_batches_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignment_batches" ADD CONSTRAINT "fee_assignment_batches_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_assignment_batches" ADD CONSTRAINT "fee_assignment_batches_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_gating_rules" ADD CONSTRAINT "fee_gating_rules_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_gating_rules" ADD CONSTRAINT "fee_gating_rules_updated_by_domain_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_orders" ADD CONSTRAINT "fee_payment_orders_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_orders" ADD CONSTRAINT "fee_payment_orders_fee_assignment_id_student_fee_assignments_id_fk" FOREIGN KEY ("fee_assignment_id") REFERENCES "public"."student_fee_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_orders" ADD CONSTRAINT "fee_payment_orders_confirmed_by_domain_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_orders" ADD CONSTRAINT "fee_payment_orders_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_fee_assignment_id_student_fee_assignments_id_fk" FOREIGN KEY ("fee_assignment_id") REFERENCES "public"."student_fee_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_payment_order_id_fee_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."fee_payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_installment_id_fee_structure_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."fee_structure_installments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_recorded_by_domain_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structure_installments" ADD CONSTRAINT "fee_structure_installments_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_cycle_level_id_cycle_levels_id_fk" FOREIGN KEY ("cycle_level_id") REFERENCES "public"."cycle_levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_access_grants" ADD CONSTRAINT "grade_access_grants_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_access_grants" ADD CONSTRAINT "grade_access_grants_profile_id_domain_users_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."domain_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_access_grants" ADD CONSTRAINT "grade_access_grants_granted_by_profile_id_domain_users_id_fk" FOREIGN KEY ("granted_by_profile_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_edit_logs" ADD CONSTRAINT "grade_edit_logs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_edit_logs" ADD CONSTRAINT "grade_edit_logs_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_edit_logs" ADD CONSTRAINT "grade_edit_logs_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_edit_logs" ADD CONSTRAINT "grade_edit_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_edit_logs" ADD CONSTRAINT "grade_edit_logs_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_edit_logs" ADD CONSTRAINT "grade_edit_logs_actor_profile_id_domain_users_id_fk" FOREIGN KEY ("actor_profile_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_scales" ADD CONSTRAINT "grade_scales_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_scales" ADD CONSTRAINT "grade_scales_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_communication_events" ADD CONSTRAINT "guardian_communication_events_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_communication_events" ADD CONSTRAINT "guardian_communication_events_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_communication_events" ADD CONSTRAINT "guardian_communication_events_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_parent_institution_id_institutions_id_fk" FOREIGN KEY ("parent_institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_default_academic_year_id_academic_years_id_fk" FOREIGN KEY ("default_academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_registration_format_id_registration_number_formats_id_fk" FOREIGN KEY ("registration_format_id") REFERENCES "public"."registration_number_formats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_domain_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD CONSTRAINT "program_export_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD CONSTRAINT "program_export_templates_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_export_templates" ADD CONSTRAINT "program_export_templates_template_id_export_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."export_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_options" ADD CONSTRAINT "program_options_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_options" ADD CONSTRAINT "program_options_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_cycle_id_study_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."study_cycles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_execution_results" ADD CONSTRAINT "promotion_execution_results_execution_id_promotion_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."promotion_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_execution_results" ADD CONSTRAINT "promotion_execution_results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_rule_id_promotion_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."promotion_rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_source_class_id_classes_id_fk" FOREIGN KEY ("source_class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_target_class_id_classes_id_fk" FOREIGN KEY ("target_class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_executions" ADD CONSTRAINT "promotion_executions_executed_by_domain_users_id_fk" FOREIGN KEY ("executed_by") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_source_class_id_classes_id_fk" FOREIGN KEY ("source_class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_cycle_level_id_cycle_levels_id_fk" FOREIGN KEY ("cycle_level_id") REFERENCES "public"."cycle_levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_number_counters" ADD CONSTRAINT "registration_number_counters_format_id_registration_number_formats_id_fk" FOREIGN KEY ("format_id") REFERENCES "public"."registration_number_formats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_number_formats" ADD CONSTRAINT "registration_number_formats_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_student_course_enrollment_id_student_course_enrollments_id_fk" FOREIGN KEY ("student_course_enrollment_id") REFERENCES "public"."student_course_enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retake_overrides" ADD CONSTRAINT "retake_overrides_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_class_course_id_class_courses_id_fk" FOREIGN KEY ("class_course_id") REFERENCES "public"."class_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_source_class_id_classes_id_fk" FOREIGN KEY ("source_class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_credit_ledgers" ADD CONSTRAINT "student_credit_ledgers_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_credit_ledgers" ADD CONSTRAINT "student_credit_ledgers_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_promotion_summaries" ADD CONSTRAINT "student_promotion_summaries_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_promotion_summaries" ADD CONSTRAINT "student_promotion_summaries_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_promotion_summaries" ADD CONSTRAINT "student_promotion_summaries_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_promotion_summaries" ADD CONSTRAINT "student_promotion_summaries_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_domain_user_id_domain_users_id_fk" FOREIGN KEY ("domain_user_id") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_cycles" ADD CONSTRAINT "study_cycles_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_units" ADD CONSTRAINT "teaching_units_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_academic_year_transition_items_transition" ON "academic_year_transition_items" USING btree ("transition_id");--> statement-breakpoint
CREATE INDEX "idx_academic_year_transition_items_student" ON "academic_year_transition_items" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_academic_year_transition_items_status" ON "academic_year_transition_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_academic_year_transition_items_outcome" ON "academic_year_transition_items" USING btree ("final_outcome");--> statement-breakpoint
CREATE INDEX "idx_academic_year_transition_items_source" ON "academic_year_transition_items" USING btree ("source_enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_academic_year_transitions_institution" ON "academic_year_transitions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_academic_year_transitions_source_year" ON "academic_year_transitions" USING btree ("source_academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_academic_year_transitions_target_year" ON "academic_year_transitions" USING btree ("target_academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_academic_year_transitions_status" ON "academic_year_transitions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_active_academic_year_transition" ON "academic_year_transitions" USING btree ("institution_id","source_academic_year_id","target_academic_year_id") WHERE "academic_year_transitions"."status" IN ('draft', 'ready', 'pending_approval', 'approved', 'running');--> statement-breakpoint
CREATE INDEX "idx_academic_years_institution" ON "academic_years" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_admission_app_docs_application" ON "admission_application_documents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_admission_app_docs_institution" ON "admission_application_documents" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_admission_applications_institution" ON "admission_applications" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_admission_applications_applicant" ON "admission_applications" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "idx_admission_applications_program" ON "admission_applications" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_admission_applications_year" ON "admission_applications" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_admission_applications_status" ON "admission_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_admission_doc_req_institution" ON "admission_document_requirements" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_admission_doc_req_program" ON "admission_document_requirements" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_applicants_institution" ON "applicants" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_excuse_audit_record" ON "attendance_excuse_audit_logs" USING btree ("attendance_record_id");--> statement-breakpoint
CREATE INDEX "idx_excuse_audit_institution" ON "attendance_excuse_audit_logs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exemption_log_cc_student" ON "attendance_exemption_logs" USING btree ("class_course_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_exemption_log_institution" ON "attendance_exemption_logs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_exemption_institution" ON "attendance_exemptions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_records_institution" ON "attendance_records" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_records_session" ON "attendance_records" USING btree ("attendance_session_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_records_student" ON "attendance_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_sessions_institution" ON "attendance_sessions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_sessions_class_course" ON "attendance_sessions" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_sessions_academic_year" ON "attendance_sessions" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_sessions_date" ON "attendance_sessions" USING btree ("session_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_atten_session_exceptional" ON "attendance_sessions" USING btree ("class_course_id","session_date") WHERE "attendance_sessions"."course_session_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_atten_session_scheduled" ON "attendance_sessions" USING btree ("class_course_id","course_session_id","session_date") WHERE "attendance_sessions"."course_session_id" IS NOT NULL;--> statement-breakpoint
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
CREATE INDEX "idx_class_course_access_institution" ON "class_course_access_logs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_class_course_access_actor" ON "class_course_access_logs" USING btree ("actor_profile_id");--> statement-breakpoint
CREATE INDEX "idx_class_course_access_course" ON "class_course_access_logs" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_institution_id" ON "class_courses" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_class_id" ON "class_courses" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_course_id" ON "class_courses" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_teacher_id" ON "class_courses" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "idx_class_courses_semester_id" ON "class_courses" USING btree ("semester_id");--> statement-breakpoint
CREATE INDEX "idx_class_export_templates_class" ON "class_export_templates" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_class_export_templates_template" ON "class_export_templates" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_classes_institution_id" ON "classes" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_classes_program_id" ON "classes" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_classes_academic_year_id" ON "classes" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_classes_semester_id" ON "classes" USING btree ("semester_id");--> statement-breakpoint
CREATE INDEX "idx_classes_cycle_level_id" ON "classes" USING btree ("cycle_level_id");--> statement-breakpoint
CREATE INDEX "idx_classes_program_option_id" ON "classes" USING btree ("program_option_id");--> statement-breakpoint
CREATE INDEX "idx_course_prereq_course" ON "course_prerequisites" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_course_prereq_requirement" ON "course_prerequisites" USING btree ("prerequisite_course_id");--> statement-breakpoint
CREATE INDEX "idx_course_sessions_institution" ON "course_sessions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_course_sessions_class_course" ON "course_sessions" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_course_sessions_academic_year" ON "course_sessions" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_course_sessions_day" ON "course_sessions" USING btree ("institution_id","day_of_week");--> statement-breakpoint
CREATE INDEX "idx_courses_program_id" ON "courses" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_courses_teaching_unit_id" ON "courses" USING btree ("teaching_unit_id");--> statement-breakpoint
CREATE INDEX "idx_courses_default_teacher_id" ON "courses" USING btree ("default_teacher_id");--> statement-breakpoint
CREATE INDEX "idx_cycle_levels_cycle" ON "cycle_levels" USING btree ("cycle_id");--> statement-breakpoint
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
CREATE UNIQUE INDEX "uq_delib_no_semester" ON "deliberations" USING btree ("institution_id","class_id","academic_year_id","type") WHERE "deliberations"."semester_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_delib_with_semester" ON "deliberations" USING btree ("institution_id","class_id","semester_id","academic_year_id","type") WHERE "deliberations"."semester_id" IS NOT NULL;--> statement-breakpoint
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
CREATE INDEX "idx_enrollment_window_status" ON "enrollment_windows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_enrollments_institution_id" ON "enrollments" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_student_id" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_class_id" ON "enrollments" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_year_id" ON "enrollments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_enrollments_admission_type" ON "enrollments" USING btree ("admission_type");--> statement-breakpoint
CREATE INDEX "idx_exam_audit_events_exam" ON "exam_audit_events" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_exam_audit_events_institution" ON "exam_audit_events" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exam_grade_editors_exam" ON "exam_grade_editors" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_exam_grade_editors_editor" ON "exam_grade_editors" USING btree ("editor_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_exam_participation_roster" ON "exam_participation_rosters" USING btree ("exam_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_exam_roster_institution" ON "exam_participation_rosters" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exam_roster_exam" ON "exam_participation_rosters" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_exam_schedule_runs_institution" ON "exam_schedule_runs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exam_schedule_runs_year" ON "exam_schedule_runs" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_exam_schedule_runs_type" ON "exam_schedule_runs" USING btree ("exam_type_id");--> statement-breakpoint
CREATE INDEX "idx_exam_types_institution_id" ON "exam_types" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exams_institution_id" ON "exams" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exams_class_course_id" ON "exams" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_exams_date" ON "exams" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_exams_session_type" ON "exams" USING btree ("session_type");--> statement-breakpoint
CREATE INDEX "idx_exams_parent_exam_id" ON "exams" USING btree ("parent_exam_id");--> statement-breakpoint
CREATE INDEX "idx_export_templates_institution" ON "export_templates" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_export_templates_type" ON "export_templates" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_fee_assignment_batches_institution" ON "fee_assignment_batches" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_fee_assignment_batches_created_at" ON "fee_assignment_batches" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_fee_gating_rules_institution" ON "fee_gating_rules" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_fee_payment_orders_assignment" ON "fee_payment_orders" USING btree ("fee_assignment_id");--> statement-breakpoint
CREATE INDEX "idx_fee_payment_orders_institution_status" ON "fee_payment_orders" USING btree ("institution_id","status");--> statement-breakpoint
CREATE INDEX "idx_fee_payments_assignment" ON "fee_payments" USING btree ("fee_assignment_id");--> statement-breakpoint
CREATE INDEX "idx_fee_payments_institution_date" ON "fee_payments" USING btree ("institution_id","payment_date");--> statement-breakpoint
CREATE INDEX "idx_fee_payments_order" ON "fee_payments" USING btree ("payment_order_id");--> statement-breakpoint
CREATE INDEX "idx_fee_installments_structure" ON "fee_structure_installments" USING btree ("fee_structure_id");--> statement-breakpoint
CREATE INDEX "idx_fee_structures_institution_year" ON "fee_structures" USING btree ("institution_id","academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_fee_structures_program" ON "fee_structures" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_grade_access_grants_institution" ON "grade_access_grants" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_grade_access_grants_profile" ON "grade_access_grants" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_grade_edit_logs_exam" ON "grade_edit_logs" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_grade_edit_logs_actor" ON "grade_edit_logs" USING btree ("actor_profile_id");--> statement-breakpoint
CREATE INDEX "idx_grade_edit_logs_institution" ON "grade_edit_logs" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grade_scales_institution_only_unique" ON "grade_scales" USING btree ("institution_id") WHERE "grade_scales"."program_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "grade_scales_program_unique" ON "grade_scales" USING btree ("institution_id","program_id") WHERE "grade_scales"."program_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_grades_student_id" ON "grades" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_grades_exam_id" ON "grades" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_guardian_comm_events_guardian" ON "guardian_communication_events" USING btree ("guardian_id");--> statement-breakpoint
CREATE INDEX "idx_guardian_comm_events_student" ON "guardian_communication_events" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_guardian_comm_events_institution" ON "guardian_communication_events" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_guardians_institution" ON "guardians" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient" ON "notifications" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_status" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_program_export_templates_program" ON "program_export_templates" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_program_export_templates_template" ON "program_export_templates" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_program_options_program_id" ON "program_options" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_program_options_institution_id" ON "program_options" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_programs_institution_id" ON "programs" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_programs_center_id" ON "programs" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_results_execution" ON "promotion_execution_results" USING btree ("execution_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_results_student" ON "promotion_execution_results" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_results_promoted" ON "promotion_execution_results" USING btree ("was_promoted");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_rule" ON "promotion_executions" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_source_class" ON "promotion_executions" USING btree ("source_class_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_target_class" ON "promotion_executions" USING btree ("target_class_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_year" ON "promotion_executions" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_executions_executor" ON "promotion_executions" USING btree ("executed_by");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_institution_id" ON "promotion_rules" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_source_class" ON "promotion_rules" USING btree ("source_class_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_program" ON "promotion_rules" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_cycle_level" ON "promotion_rules" USING btree ("cycle_level_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_rules_active" ON "promotion_rules" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_registration_counter_format_id" ON "registration_number_counters" USING btree ("format_id");--> statement-breakpoint
CREATE INDEX "idx_registration_formats_active" ON "registration_number_formats" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_registration_formats_institution_id" ON "registration_number_formats" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_institution" ON "retake_overrides" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_exam" ON "retake_overrides" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_retake_override_enrollment" ON "retake_overrides" USING btree ("student_course_enrollment_id");--> statement-breakpoint
CREATE INDEX "idx_rooms_institution" ON "rooms" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_semesters_order" ON "semesters" USING btree ("order_index");--> statement-breakpoint
CREATE INDEX "idx_student_course_student" ON "student_course_enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_course_class_course" ON "student_course_enrollments" USING btree ("class_course_id");--> statement-breakpoint
CREATE INDEX "idx_student_course_course" ON "student_course_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "idx_student_course_year" ON "student_course_enrollments" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_student_credit_ledgers_student" ON "student_credit_ledgers" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_credit_ledgers_year" ON "student_credit_ledgers" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_student_fee_assignments_institution_year" ON "student_fee_assignments" USING btree ("institution_id","academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_student_fee_assignments_student" ON "student_fee_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_fee_assignments_status" ON "student_fee_assignments" USING btree ("institution_id","status");--> statement-breakpoint
CREATE INDEX "idx_student_guardians_institution" ON "student_guardians" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_student_guardians_student" ON "student_guardians" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_guardians_guardian" ON "student_guardians" USING btree ("guardian_id");--> statement-breakpoint
CREATE INDEX "idx_student_promotion_summary_year" ON "student_promotion_summaries" USING btree ("academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_student_promotion_summary_class" ON "student_promotion_summaries" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_student_promotion_summary_program" ON "student_promotion_summaries" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_student_promotion_summary_ontrack" ON "student_promotion_summaries" USING btree ("is_on_track");--> statement-breakpoint
CREATE INDEX "idx_students_institution_id" ON "students" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_students_class_id" ON "students" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "idx_students_domain_user_id" ON "students" USING btree ("domain_user_id");--> statement-breakpoint
CREATE INDEX "idx_study_cycles_institution" ON "study_cycles" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_teaching_units_program_id" ON "teaching_units" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");