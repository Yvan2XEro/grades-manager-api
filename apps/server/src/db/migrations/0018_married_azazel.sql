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
ALTER TABLE "exam_participation_rosters" ADD CONSTRAINT "exam_participation_rosters_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_participation_rosters" ADD CONSTRAINT "exam_participation_rosters_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_participation_rosters" ADD CONSTRAINT "exam_participation_rosters_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_participation_rosters" ADD CONSTRAINT "exam_participation_rosters_locked_by_domain_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."domain_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_exam_participation_roster" ON "exam_participation_rosters" USING btree ("exam_id","student_id");--> statement-breakpoint
CREATE INDEX "idx_exam_roster_institution" ON "exam_participation_rosters" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_exam_roster_exam" ON "exam_participation_rosters" USING btree ("exam_id");