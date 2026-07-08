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
ALTER TABLE "guardian_communication_events" ADD CONSTRAINT "guardian_communication_events_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_communication_events" ADD CONSTRAINT "guardian_communication_events_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian_communication_events" ADD CONSTRAINT "guardian_communication_events_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardians" ADD CONSTRAINT "guardians_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_guardian_id_guardians_id_fk" FOREIGN KEY ("guardian_id") REFERENCES "public"."guardians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_guardian_comm_events_guardian" ON "guardian_communication_events" USING btree ("guardian_id");--> statement-breakpoint
CREATE INDEX "idx_guardian_comm_events_student" ON "guardian_communication_events" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_guardian_comm_events_institution" ON "guardian_communication_events" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_guardians_institution" ON "guardians" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_student_guardians_institution" ON "student_guardians" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_student_guardians_student" ON "student_guardians" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_student_guardians_guardian" ON "student_guardians" USING btree ("guardian_id");