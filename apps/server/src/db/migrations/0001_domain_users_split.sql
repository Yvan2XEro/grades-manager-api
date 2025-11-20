CREATE TABLE "domain_users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text,
	"business_role" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"primary_email" text NOT NULL,
	"phone" text,
	"date_of_birth" date NOT NULL,
	"place_of_birth" text NOT NULL,
	"gender" text NOT NULL,
	"nationality" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_domain_users_auth" UNIQUE("auth_user_id"),
	CONSTRAINT "uq_domain_users_email" UNIQUE("primary_email")
);
--> statement-breakpoint
ALTER TABLE "domain_users" ADD CONSTRAINT "domain_users_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "domain_user_id" text;
--> statement-breakpoint
UPDATE "students" SET "domain_user_id" = gen_random_uuid();
--> statement-breakpoint
INSERT INTO "domain_users" (
	"id",
	"business_role",
	"first_name",
	"last_name",
	"primary_email",
	"date_of_birth",
	"place_of_birth",
	"gender",
	"status",
	"created_at",
	"updated_at"
) SELECT
	"domain_user_id",
	'student',
	"first_name",
	"last_name",
	"email",
	DATE '2000-01-01',
	'Unknown',
	'other',
	'active',
	COALESCE("created_at", now()),
	COALESCE("created_at", now())
FROM "students";
--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "domain_user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_domain_user_id_domain_users_id_fk" FOREIGN KEY ("domain_user_id") REFERENCES "public"."domain_users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "uq_students_domain_user" UNIQUE("domain_user_id");
--> statement-breakpoint
CREATE INDEX "idx_students_domain_user_id" ON "students" USING btree ("domain_user_id");
--> statement-breakpoint
ALTER TABLE "students" DROP CONSTRAINT "uq_students_email";
--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN IF EXISTS "first_name";
--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN IF EXISTS "last_name";
--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN IF EXISTS "email";
