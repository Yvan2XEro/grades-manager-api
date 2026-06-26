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
CREATE TABLE "fee_payments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"fee_assignment_id" text NOT NULL,
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
ALTER TABLE "fee_gating_rules" ADD CONSTRAINT "fee_gating_rules_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_gating_rules" ADD CONSTRAINT "fee_gating_rules_updated_by_domain_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_fee_assignment_id_student_fee_assignments_id_fk" FOREIGN KEY ("fee_assignment_id") REFERENCES "public"."student_fee_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_installment_id_fee_structure_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."fee_structure_installments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_recorded_by_domain_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structure_installments" ADD CONSTRAINT "fee_structure_installments_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_cycle_level_id_cycle_levels_id_fk" FOREIGN KEY ("cycle_level_id") REFERENCES "public"."cycle_levels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_fee_structure_id_fee_structures_id_fk" FOREIGN KEY ("fee_structure_id") REFERENCES "public"."fee_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fee_assignments" ADD CONSTRAINT "student_fee_assignments_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fee_gating_rules_institution" ON "fee_gating_rules" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_fee_payments_assignment" ON "fee_payments" USING btree ("fee_assignment_id");--> statement-breakpoint
CREATE INDEX "idx_fee_payments_institution_date" ON "fee_payments" USING btree ("institution_id","payment_date");--> statement-breakpoint
CREATE INDEX "idx_fee_installments_structure" ON "fee_structure_installments" USING btree ("fee_structure_id");--> statement-breakpoint
CREATE INDEX "idx_fee_structures_institution_year" ON "fee_structures" USING btree ("institution_id","academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_fee_structures_program" ON "fee_structures" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "idx_student_fee_assignments_institution_year" ON "student_fee_assignments" USING btree ("institution_id","academic_year_id");--> statement-breakpoint
CREATE INDEX "idx_student_fee_assignments_student" ON "student_fee_assignments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_fee_assignments_status" ON "student_fee_assignments" USING btree ("institution_id","status");