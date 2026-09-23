CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"is_anonymous" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"shot_id" text NOT NULL,
	"kind" text NOT NULL,
	"version" integer NOT NULL,
	"parent_asset_id" text,
	"status" text NOT NULL,
	"model" text NOT NULL,
	"prompt" text NOT NULL,
	"source_url" text,
	"provider_request_id" text,
	"url" text,
	"error" text,
	"cost_credits" integer DEFAULT 0 NOT NULL,
	"meta" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assets_shot_kind_version_key" UNIQUE("shot_id","kind","version"),
	CONSTRAINT "assets_kind_check" CHECK ("assets"."kind" in ('frame','video')),
	CONSTRAINT "assets_status_check" CHECK ("assets"."status" in ('queued','submitted','running','persisting','succeeded','failed'))
);
--> statement-breakpoint
CREATE TABLE "directions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"ordinal" smallint NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"look" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"brief" text NOT NULL,
	"aspect_ratio" text NOT NULL,
	"styles" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" text NOT NULL,
	"selected_direction_id" text,
	"is_demo" boolean DEFAULT false NOT NULL,
	"elements" jsonb,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_status_check" CHECK ("projects"."status" in ('planning','planned','selected','producing','ready','failed'))
);
--> statement-breakpoint
CREATE TABLE "shots" (
	"id" text PRIMARY KEY NOT NULL,
	"direction_id" text NOT NULL,
	"project_id" text NOT NULL,
	"ordinal" smallint NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"camera_move" text NOT NULL,
	"duration_s" smallint NOT NULL,
	"lighting" text NOT NULL,
	"mood" text NOT NULL,
	"frame_stale" boolean DEFAULT false NOT NULL,
	"current_frame_asset_id" text,
	"current_video_asset_id" text
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "directions" ADD CONSTRAINT "directions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shots" ADD CONSTRAINT "shots_direction_id_directions_id_fk" FOREIGN KEY ("direction_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shots" ADD CONSTRAINT "shots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assets_project_idx" ON "assets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "assets_status_updated_idx" ON "assets" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "directions_project_idx" ON "directions" USING btree ("project_id","ordinal");--> statement-breakpoint
CREATE INDEX "projects_user_created_idx" ON "projects" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "shots_direction_idx" ON "shots" USING btree ("direction_id","ordinal");--> statement-breakpoint
CREATE INDEX "shots_project_idx" ON "shots" USING btree ("project_id");