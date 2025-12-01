CREATE TABLE "cycle_levels" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" text NOT NULL,
	"order_index" integer NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"min_credits" integer DEFAULT 60 NOT NULL,
	CONSTRAINT "uq_cycle_levels_code" UNIQUE("cycle_id","code"),
	CONSTRAINT "uq_cycle_levels_order" UNIQUE("cycle_id","order_index")
);
--> statement-breakpoint
CREATE TABLE "study_cycles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" text NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"total_credits_required" integer DEFAULT 180 NOT NULL,
	"duration_years" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_study_cycles_faculty_code" UNIQUE("faculty_id","code")
);
--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "cycle_level_id" text;
--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "cycle_id" text;
--> statement-breakpoint
ALTER TABLE "cycle_levels" ADD CONSTRAINT "cycle_levels_cycle_id_study_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."study_cycles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "study_cycles" ADD CONSTRAINT "study_cycles_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_cycle_levels_cycle" ON "cycle_levels" USING btree ("cycle_id");
--> statement-breakpoint
CREATE INDEX "idx_study_cycles_faculty" ON "study_cycles" USING btree ("faculty_id");
--> statement-breakpoint
WITH inserted_cycles AS (
	INSERT INTO study_cycles (id, faculty_id, code, name, description, total_credits_required, duration_years)
	SELECT gen_random_uuid(), f.id, 'default', f.name || ' Cycle', NULL, 180, 3
	FROM faculties f
	RETURNING id, faculty_id
)
UPDATE programs p
SET cycle_id = ic.id
FROM inserted_cycles ic
WHERE p.faculty_id = ic.faculty_id;
--> statement-breakpoint
WITH base_levels AS (
	INSERT INTO cycle_levels (id, cycle_id, order_index, code, name, min_credits)
	SELECT gen_random_uuid(), sc.id, 1, 'L1', 'Level 1', 60
	FROM study_cycles sc
	RETURNING id, cycle_id
)
UPDATE classes c
SET cycle_level_id = bl.id
FROM programs p
JOIN base_levels bl ON p.cycle_id = bl.cycle_id
WHERE c.program_id = p.id;
--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_cycle_level_id_cycle_levels_id_fk" FOREIGN KEY ("cycle_level_id") REFERENCES "public"."cycle_levels"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_cycle_id_study_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."study_cycles"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
UPDATE programs p
SET cycle_id = sc.id
FROM study_cycles sc
WHERE sc.faculty_id = p.faculty_id AND p.cycle_id IS NULL;
--> statement-breakpoint
UPDATE classes c
SET cycle_level_id = cl.id
FROM programs p
JOIN cycle_levels cl ON cl.cycle_id = p.cycle_id AND cl.order_index = 1
WHERE c.program_id = p.id AND c.cycle_level_id IS NULL;
--> statement-breakpoint
ALTER TABLE "classes" ALTER COLUMN "cycle_level_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "programs" ALTER COLUMN "cycle_id" SET NOT NULL;
--> statement-breakpoint
CREATE INDEX "idx_classes_cycle_level_id" ON "classes" USING btree ("cycle_level_id");
--> statement-breakpoint
CREATE INDEX "idx_programs_cycle_id" ON "programs" USING btree ("cycle_id");
