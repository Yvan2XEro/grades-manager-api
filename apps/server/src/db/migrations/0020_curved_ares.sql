CREATE TABLE "document_downloads" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"student_id" text NOT NULL,
	"kind" text NOT NULL,
	"downloaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_downloads" ADD CONSTRAINT "document_downloads_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_downloads" ADD CONSTRAINT "document_downloads_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;