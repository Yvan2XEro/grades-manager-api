ALTER TABLE "admission_applications" ADD COLUMN "second_choice_program_id" text;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD COLUMN "third_choice_program_id" text;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD COLUMN "academic_level" text;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD COLUMN "training_type" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "place_of_birth" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "country_of_birth" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "exact_date_of_birth" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "id_card_number" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "marital_status" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "employment_status" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "primary_language" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "has_disability" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "postal_box" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "origin_country" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "origin_region" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "origin_department" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "student_status" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "entry_diploma_type" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "bac_series" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "bac_year" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "bac_mention" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "bac_average" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "bac_institution" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "bac_country" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "bac_matricule" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "has_prior_higher_ed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "prior_institution" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "prior_field" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "prior_level" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "prior_start_year" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "prior_end_year" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "prior_result" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "father_name" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "father_profession" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "father_phone" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "father_alive" boolean;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "mother_name" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "mother_profession" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "mother_phone" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "mother_alive" boolean;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "guardian_name" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "guardian_relation" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "guardian_phone" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "emergency_contact_phone" text;--> statement-breakpoint
ALTER TABLE "applicants" ADD COLUMN "emergency_contact_city" text;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_second_choice_program_id_programs_id_fk" FOREIGN KEY ("second_choice_program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_applications" ADD CONSTRAINT "admission_applications_third_choice_program_id_programs_id_fk" FOREIGN KEY ("third_choice_program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;