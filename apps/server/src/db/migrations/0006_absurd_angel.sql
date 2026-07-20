CREATE TABLE "grade_scales" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"pass_threshold" numeric(5, 2) DEFAULT '10' NOT NULL,
	"compensation_threshold" numeric(5, 2) DEFAULT '8' NOT NULL,
	"mention_ranges" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grade_scales_institution_unique" UNIQUE("institution_id")
);
--> statement-breakpoint
ALTER TABLE "grade_scales" ADD CONSTRAINT "grade_scales_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;