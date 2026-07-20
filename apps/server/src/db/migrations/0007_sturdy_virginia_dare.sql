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
ALTER TABLE "course_sessions" ADD COLUMN "room_id" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_rooms_institution" ON "rooms" USING btree ("institution_id");--> statement-breakpoint
ALTER TABLE "course_sessions" ADD CONSTRAINT "course_sessions_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE set null ON UPDATE no action;