import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('unipass.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS students_cache (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL,
      card_code TEXT NOT NULL,
      enrollment_status TEXT,
      enrollment_id TEXT,
      photo_url TEXT,
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_validations (
      id TEXT PRIMARY KEY NOT NULL,
      student_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      route_id TEXT,
      latitude REAL,
      longitude REAL,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0
    );
  `);
}
