CREATE TABLE IF NOT EXISTS "ingredients" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipe_id" bigint NOT NULL,
	"position" integer NOT NULL,
	"quantity" numeric,
	"unit" text,
	"name" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "method_steps" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipe_id" bigint NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recipes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"title" text NOT NULL,
	"time_minutes" integer NOT NULL,
	"difficulty" text NOT NULL,
	"servings" integer NOT NULL,
	"calories_total" integer,
	"protein_grams_total" integer,
	"image_url" text,
	"source_url" text,
	"recipe_notes" text,
	"favorite" boolean DEFAULT false NOT NULL,
	"price_tier" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipes_difficulty_check" CHECK ("recipes"."difficulty" IN ('easy','medium','hard')),
	CONSTRAINT "recipes_price_tier_check" CHECK ("recipes"."price_tier" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_notes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipe_id" bigint NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"google_sub" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"picture_url" text,
	"is_allowed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "utensils" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipe_id" bigint NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "method_steps" ADD CONSTRAINT "method_steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "utensils" ADD CONSTRAINT "utensils_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ingredients_recipe_idx" ON "ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "method_steps_recipe_idx" ON "method_steps" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipes_user_created_idx" ON "recipes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipes_user_favorite_idx" ON "recipes" USING btree ("user_id","favorite");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_notes_recipe_idx" ON "user_notes" USING btree ("recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_sub_idx" ON "users" USING btree ("google_sub");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "utensils_recipe_idx" ON "utensils" USING btree ("recipe_id");