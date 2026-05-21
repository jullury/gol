import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('gol.db');
  await migrate(db);
  return db;
}

async function migrate(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS buses (
      id TEXT PRIMARY KEY,
      numero TEXT NOT NULL,
      name TEXT NOT NULL,
      numberOfPlace INTEGER NOT NULL,
      seatColumns INTEGER NOT NULL DEFAULT 5,
      seatRows INTEGER NOT NULL DEFAULT 0,
      photo1 TEXT,
      photo2 TEXT,
      photo3 TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      deletedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      busId TEXT NOT NULL,
      startDateTime INTEGER NOT NULL,
      endDateTime INTEGER,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (busId) REFERENCES buses(id)
    );

    CREATE TABLE IF NOT EXISTS trip_events (
      id TEXT PRIMARY KEY,
      tripId TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (tripId) REFERENCES trips(id),
      UNIQUE (tripId, sequence)
    );

    CREATE INDEX IF NOT EXISTS idx_trips_busId ON trips(busId);
    CREATE INDEX IF NOT EXISTS idx_trip_events_tripId ON trip_events(tripId);
    CREATE INDEX IF NOT EXISTS idx_trip_events_sequence ON trip_events(tripId, sequence);
  `);

  const columns = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM pragma_table_info('buses')",
  );
  const columnNames = columns.map((c) => c.name);
  if (!columnNames.includes('seatColumns')) {
    await database.execAsync('ALTER TABLE buses ADD COLUMN seatColumns INTEGER NOT NULL DEFAULT 5');
  }
  if (!columnNames.includes('seatRows')) {
    await database.execAsync('ALTER TABLE buses ADD COLUMN seatRows INTEGER NOT NULL DEFAULT 0');
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
