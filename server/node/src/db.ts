import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = openDatabase();
  }
  return db;
}

function openDatabase() {
  const dbPath = path.join(__dirname, '../../data/database.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  console.log(`Database connected at ${dbPath}`);

  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);
