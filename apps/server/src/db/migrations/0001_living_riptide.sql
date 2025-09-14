ALTER TABLE "profiles" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "profiles" CASCADE;--> statement-breakpoint
ALTER TABLE "class_courses" DROP CONSTRAINT "class_courses_teacher_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_default_teacher_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "class_courses" ADD CONSTRAINT "class_courses_teacher_id_user_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_default_teacher_id_user_id_fk" FOREIGN KEY ("default_teacher_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;