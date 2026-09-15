import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tickets = sqliteTable("tickets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ticketId: text("ticket_id").notNull().unique(),
  customerName: text("customer_name").notNull().default("Guest customer"),
  email: text("email").notNull().default("Not provided"),
  issue: text("issue").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("Normal"),
  status: text("status").notNull().default("Open"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_tickets_status_created").on(table.status, table.createdAt)]);

export type Ticket = typeof tickets.$inferSelect;
