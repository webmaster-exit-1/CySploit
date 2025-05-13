CREATE TABLE "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_address" text NOT NULL,
	"mac_address" text NOT NULL,
	"device_type" text,
	"device_name" text,
	"vendor" text,
	"os_type" text,
	"is_online" boolean DEFAULT true,
	"last_seen" timestamp DEFAULT now(),
	"open_ports" jsonb,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "packets" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer,
	"source_ip" text NOT NULL,
	"destination_ip" text NOT NULL,
	"protocol" text,
	"source_port" integer,
	"destination_port" integer,
	"size" integer,
	"timestamp" timestamp DEFAULT now(),
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"ended_at" timestamp,
	"is_active" boolean DEFAULT true,
	"network_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"is_secret" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "vulnerabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" integer NOT NULL,
	"cve_id" text,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'detected',
	"discovered_at" timestamp DEFAULT now()
);
