CREATE TABLE "credit_accounts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"entry_type" text NOT NULL,
	"amount" integer NOT NULL,
	"asset_id" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_ledger_idempotencyKey_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "credit_ledger_type_check" CHECK ("credit_ledger"."entry_type" in ('grant','reserve','capture','release','transfer_in','transfer_out'))
);
--> statement-breakpoint
CREATE TABLE "usage_daily" (
	"day" date NOT NULL,
	"scope" text NOT NULL,
	"scope_id" text NOT NULL,
	"videos" integer DEFAULT 0 NOT NULL,
	"spend_cents" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_daily_day_scope_scope_id_pk" PRIMARY KEY("day","scope","scope_id")
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "attempt" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "credit_ledger_user_idx" ON "credit_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_ledger_asset_idx" ON "credit_ledger" USING btree ("asset_id");