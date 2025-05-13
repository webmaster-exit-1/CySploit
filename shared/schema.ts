import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Settings - just for API keys and configuration
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  isSecret: boolean("is_secret").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Store real nmap scan results
export const nmapScans = pgTable("nmap_scans", {
  id: serial("id").primaryKey(),
  command: text("command").notNull(),
  target: text("target").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default("running"),
  xmlOutput: text("xml_output"),
  rawOutput: text("raw_output"),
});

export const insertNmapScanSchema = createInsertSchema(nmapScans).omit({
  id: true,
  startTime: true,
  endTime: true,
});

// Add 'name' to the hosts table schema
export const hosts = pgTable("hosts", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").notNull(),
  ipAddress: text("ip_address").notNull(),
  name: text("name"), // Add this line
  hostname: text("hostname"),
  state: text("state").default("unknown"), // Making this field have a default value
  lastSeen: timestamp("last_seen").defaultNow(),
  osDetails: jsonb("os_details").$type<Record<string, any>>(),
  macAddress: text("mac_address"),
  vendor: text("vendor"),
});

export const insertHostSchema = createInsertSchema(hosts).omit({
  id: true,
  lastSeen: true,
});

// Real ports found in scans
export const ports = pgTable("ports", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").references(() => hosts.id, { onDelete: "cascade" }), // Changed to optional with reference
  scanId: integer("scan_id").references(() => nmapScans.id), // Added to allow ports without hosts
  portNumber: integer("port_number"),
  protocol: text("protocol").notNull(),
  state: text("state").notNull(),
  service: text("service"),
  product: text("product"),
  version: text("version"),
  extraInfo: text("extra_info"),
});

export const insertPortSchema = createInsertSchema(ports).omit({
  id: true,
});

// Real vulnerabilities found by scanners
export const vulnerabilities = pgTable("vulnerabilities", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull(),
  portId: integer("port_id"),
  cveId: text("cve_id"),
  cvssScore: text("cvss_score"),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  discoveredAt: timestamp("discovered_at").defaultNow(),
  scanId: integer("scan_id"),
});

export const insertVulnerabilitySchema = createInsertSchema(vulnerabilities).omit({
  id: true,
  discoveredAt: true,
});

// Real packet capture sessions
export const captureSession = pgTable("capture_sessions", {
  id: serial("id").primaryKey(),
  interface: text("interface").notNull(),
  filter: text("filter"),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default("running"),
  pcapFile: text("pcap_file"),
  packetCount: integer("packet_count").default(0),
});

export const insertCaptureSessionSchema = createInsertSchema(captureSession).omit({
  id: true,
  startTime: true,
  endTime: true,
  packetCount: true,
});

// Actual packet data from tcpdump
export const packets = pgTable("packets", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  sourceIp: text("source_ip").notNull(),
  destinationIp: text("destination_ip").notNull(),
  sourcePort: integer("source_port"),
  destinationPort: integer("destination_port"),
  protocol: text("protocol"),
  length: integer("length"),
  tcpFlags: text("tcp_flags"),
  data: text("data"),
});

export const insertPacketSchema = createInsertSchema(packets).omit({
  id: true,
  timestamp: true,
});

// Shodan search results
export const shodanSearches = pgTable("shodan_searches", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  searchTime: timestamp("search_time").defaultNow(),
  resultCount: integer("result_count").default(0),
  rawResults: jsonb("raw_results"),
});

export const insertShodanSearchSchema = createInsertSchema(shodanSearches).omit({
  id: true,
  searchTime: true,
  resultCount: true,
});

// Export types
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingsSchema>;

export type NmapScan = typeof nmapScans.$inferSelect;
export type InsertNmapScan = z.infer<typeof insertNmapScanSchema>;

export type Host = typeof hosts.$inferSelect;
export type InsertHost = z.infer<typeof insertHostSchema>;

export type Port = typeof ports.$inferSelect;
export type InsertPort = z.infer<typeof insertPortSchema>;

export type Vulnerability = typeof vulnerabilities.$inferSelect;
export type InsertVulnerability = z.infer<typeof insertVulnerabilitySchema>;

export type CaptureSession = typeof captureSession.$inferSelect;
export type InsertCaptureSession = z.infer<typeof insertCaptureSessionSchema>;

export type Packet = typeof packets.$inferSelect;
export type InsertPacket = z.infer<typeof insertPacketSchema>;

export type ShodanSearch = typeof shodanSearches.$inferSelect;
export type InsertShodanSearch = z.infer<typeof insertShodanSearchSchema>;
