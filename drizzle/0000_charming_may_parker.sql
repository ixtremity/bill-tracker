CREATE TABLE "alert_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"bill_id" integer NOT NULL,
	"sent_at" timestamp,
	"email_to" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_to" text NOT NULL,
	"days_before_due" integer DEFAULT 3,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'USD',
	"due_date" timestamp NOT NULL,
	"paid_at" timestamp,
	"payment_status" text DEFAULT 'pending',
	"card_id" integer,
	"notes" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text DEFAULT '#6366f1',
	"created_at" timestamp,
	CONSTRAINT "entities_name_unique" UNIQUE("name"),
	CONSTRAINT "entities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"last4" text,
	"brand" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"url" text,
	"category" text DEFAULT 'other',
	"billing_cycle" text DEFAULT 'monthly',
	"expected_amount" real,
	"currency" text DEFAULT 'USD',
	"billing_day" integer,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "alert_log" ADD CONSTRAINT "alert_log_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_card_id_payment_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."payment_cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_log_bill_email_unique" ON "alert_log" USING btree ("bill_id","email_to");--> statement-breakpoint
CREATE UNIQUE INDEX "bill_subscription_due_unique" ON "bills" USING btree ("subscription_id","due_date");