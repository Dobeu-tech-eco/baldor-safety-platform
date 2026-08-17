import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentsTable = pgTable("incidents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  occurrence_number: text("occurrence_number").notNull().unique(),
  record_id: text("record_id").notNull().default(""),
  base_occurrence: text("base_occurrence").notNull().default(""),
  suffix: integer("suffix"),
  is_followon: boolean("is_followon").notNull().default(false),
  incident_type: text("incident_type").notNull().default(""),
  employee: text("employee").notNull().default(""),
  employee_number: text("employee_number").notNull().default(""),
  loss_date: date("loss_date"),
  report_date: date("report_date"),
  location: text("location").notNull().default(""),
  branch: text("branch").notNull().default(""),
  osha_recordable: text("osha_recordable").notNull().default(""),
  dot_recordable: text("dot_recordable").notNull().default(""),
  event_description: text("event_description").notNull().default(""),
  status: text("status").notNull().default(""),
  claim_number: text("claim_number").notNull().default(""),
  preventable: text("preventable").notNull().default(""),
  injury_type_code: text("injury_type_code").notNull().default(""),
  tenure_years: numeric("tenure_years", { mode: "number" }),
  hire_date: date("hire_date"),
  tenure_days: integer("tenure_days"),
  tier: integer("tier"),
  is_injury: boolean("is_injury").notNull().default(false),
  row_hash: text("row_hash").notNull().default(""),
  upload_batch_id: uuid("upload_batch_id"),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const mileageTable = pgTable(
  "mileage",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    branch: text("branch").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    miles: numeric("miles", { mode: "number" }).notNull().default(0),
  },
  (t) => [uniqueIndex("mileage_branch_year_month").on(t.branch, t.year, t.month)],
);

export const overridesTable = pgTable("overrides", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  occurrence_number: text("occurrence_number").notNull().unique(),
  preventable: text("preventable").notNull(),
  note: text("note").notNull().default(""),
});

export const snowEventsTable = pgTable("snow_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  attributable_count: integer("attributable_count").notNull().default(0),
  note: text("note").notNull().default(""),
});

export const uploadBatchesTable = pgTable("upload_batches", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  uploaded_by: varchar("uploaded_by"),
  uploaded_at: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  row_count: integer("row_count").notNull().default(0),
  follow_on_removed: integer("follow_on_removed").notNull().default(0),
  classifications_restored: integer("classifications_restored")
    .notNull()
    .default(0),
  notes: text("notes").notNull().default(""),
});

export const uploadFilesTable = pgTable("upload_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  file_hash: text("file_hash").notNull().unique(),
  filename: text("filename").notNull(),
  byte_size: integer("byte_size").notNull().default(0),
  row_count: integer("row_count").notNull().default(0),
  row_hashes: text("row_hashes").array().notNull().default([]),
  uploaded_by: varchar("uploaded_by"),
  uploaded_at: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  batch_id: uuid("batch_id"),
});

export const datasetMergesTable = pgTable("dataset_merges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  source_batch_id: uuid("source_batch_id"),
  target_batch_id: uuid("target_batch_id"),
  duplicate_rows_removed: integer("duplicate_rows_removed").notNull().default(0),
  unique_rows_kept: integer("unique_rows_kept").notNull().default(0),
  new_rows_added: integer("new_rows_added").notNull().default(0),
  performed_by: varchar("performed_by"),
  performed_at: timestamp("performed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  note: text("note").notNull().default(""),
});

// App-level users: keyed by the Replit Auth user id.
export const appUsersTable = pgTable("app_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  auth_user_id: varchar("auth_user_id").unique(),
  email: text("email").notNull().unique(),
  full_name: text("full_name").notNull().default(""),
  is_admin: boolean("is_admin").notNull().default(false),
  allowlisted: boolean("allowlisted").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type Incident = typeof incidentsTable.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Mileage = typeof mileageTable.$inferSelect;
export type Override = typeof overridesTable.$inferSelect;
export type SnowEvent = typeof snowEventsTable.$inferSelect;
export type UploadBatch = typeof uploadBatchesTable.$inferSelect;
export type UploadFile = typeof uploadFilesTable.$inferSelect;
export type DatasetMerge = typeof datasetMergesTable.$inferSelect;
export type AppUser = typeof appUsersTable.$inferSelect;
