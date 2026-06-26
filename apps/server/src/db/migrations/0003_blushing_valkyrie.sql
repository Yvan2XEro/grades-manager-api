CREATE TABLE "fee_payment_orders" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" text NOT NULL,
	"fee_assignment_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'XAF' NOT NULL,
	"installment_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reference" text,
	"notes" text,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" text,
	"expires_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_fee_payment_orders_amount" CHECK ("fee_payment_orders"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "fee_payments" ADD COLUMN "payment_order_id" text;--> statement-breakpoint
ALTER TABLE "fee_payment_orders" ADD CONSTRAINT "fee_payment_orders_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_orders" ADD CONSTRAINT "fee_payment_orders_fee_assignment_id_student_fee_assignments_id_fk" FOREIGN KEY ("fee_assignment_id") REFERENCES "public"."student_fee_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_orders" ADD CONSTRAINT "fee_payment_orders_confirmed_by_domain_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payment_orders" ADD CONSTRAINT "fee_payment_orders_created_by_domain_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."domain_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fee_payment_orders_assignment" ON "fee_payment_orders" USING btree ("fee_assignment_id");--> statement-breakpoint
CREATE INDEX "idx_fee_payment_orders_institution_status" ON "fee_payment_orders" USING btree ("institution_id","status");--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_payment_order_id_fee_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."fee_payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_fee_payments_order" ON "fee_payments" USING btree ("payment_order_id");