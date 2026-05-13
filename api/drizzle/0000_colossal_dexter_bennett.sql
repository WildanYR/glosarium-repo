CREATE TABLE "glosarium_hash" (
	"word" varchar(255) PRIMARY KEY NOT NULL,
	"hash" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "glosarium_metadata" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "glosarium" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"word" varchar(255) NOT NULL,
	"meaning" text NOT NULL,
	"meaning_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, meaning)) STORED,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "glosarium_word_unique" UNIQUE("word")
);
--> statement-breakpoint
CREATE INDEX "meaning_search_idx" ON "glosarium" USING gin ("meaning_vector");--> statement-breakpoint
CREATE INDEX "word_prefix_idx" ON "glosarium" USING btree ("word" varchar_pattern_ops);