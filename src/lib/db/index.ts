import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const dataDir = join(process.cwd(), 'data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'audit.db');
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent read/write performance
sqlite.pragma('journal_mode = WAL');

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL DEFAULT 'anonymous',
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    status INTEGER NOT NULL,
    request_body TEXT,
    response_body TEXT,
    request_headers TEXT,
    response_headers TEXT,
    mode TEXT NOT NULL DEFAULT 'developer',
    duration INTEGER NOT NULL DEFAULT 0
  )
`);

export const db = drizzle(sqlite, { schema });
