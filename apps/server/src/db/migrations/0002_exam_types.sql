CREATE TABLE IF NOT EXISTS "exam_types" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_exam_types_name" ON "exam_types" ("name");
