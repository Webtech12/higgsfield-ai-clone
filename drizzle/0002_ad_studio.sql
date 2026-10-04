CREATE TABLE "uploads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talents" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"bio" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"photos" jsonb NOT NULL,
	"consent_signed_on" date NOT NULL,
	"consent_scope" text NOT NULL,
	"consent_reference" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "talents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "directions" ADD COLUMN "hook" text;--> statement-breakpoint
ALTER TABLE "directions" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "directions" ADD COLUMN "cta" text;--> statement-breakpoint
ALTER TABLE "directions" ADD COLUMN "music_brief" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "ad" jsonb;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "talent_id" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "photo_references" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "shots" ADD COLUMN "motion" text;--> statement-breakpoint
CREATE INDEX "uploads_user_created_idx" ON "uploads" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "talents_active_order_idx" ON "talents" USING btree ("is_active","sort_order");