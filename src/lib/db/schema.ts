import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: text('timestamp').notNull(),
  user: text('user').notNull().default('anonymous'),
  method: text('method').notNull(),
  url: text('url').notNull(),
  status: integer('status').notNull(),
  request_body: text('request_body'),
  response_body: text('response_body'),
  request_headers: text('request_headers'),
  response_headers: text('response_headers'),
  mode: text('mode').notNull().default('developer'),
  duration: integer('duration').notNull().default(0),
});

export type AuditLogInsert = typeof auditLog.$inferInsert;
export type AuditLogSelect = typeof auditLog.$inferSelect;
