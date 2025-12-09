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
CREATE INDEX "idx_promotion_rules_active" ON "promotion_rules" USING btree ("is_active");