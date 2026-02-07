-- Update schema to match shared/schema.ts
CREATE TABLE IF NOT EXISTS "nmap_scans" (
"id" serial PRIMARY KEY NOT NULL,
"command" text NOT NULL,
"target" text NOT NULL,
"start_time" timestamp DEFAULT now(),
"end_time" timestamp,
"status" text DEFAULT 'running' NOT NULL,
"xml_output" text,
"raw_output" text
);

CREATE TABLE IF NOT EXISTS "hosts" (
"id" serial PRIMARY KEY NOT NULL,
"scan_id" integer NOT NULL,
"ip_address" text NOT NULL,
"name" text,
"hostname" text,
"state" text DEFAULT 'unknown',
"last_seen" timestamp DEFAULT now(),
"os_details" jsonb,
"mac_address" text,
"vendor" text
);

CREATE TABLE IF NOT EXISTS "ports" (
"id" serial PRIMARY KEY NOT NULL,
"host_id" integer REFERENCES "hosts"("id") ON DELETE cascade,
"scan_id" integer REFERENCES "nmap_scans"("id"),
"port_number" integer,
"protocol" text NOT NULL,
"state" text NOT NULL,
"service" text,
"product" text,
"version" text,
"extra_info" text
);

CREATE TABLE IF NOT EXISTS "capture_sessions" (
"id" serial PRIMARY KEY NOT NULL,
"interface" text NOT NULL,
"filter" text,
"start_time" timestamp DEFAULT now(),
"end_time" timestamp,
"status" text DEFAULT 'running' NOT NULL,
"pcap_file" text,
"packet_count" integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "shodan_searches" (
"id" serial PRIMARY KEY NOT NULL,
"query" text NOT NULL,
"search_time" timestamp DEFAULT now(),
"result_count" integer DEFAULT 0,
"raw_results" jsonb
);
