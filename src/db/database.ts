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
      driverSeatCount INTEGER NOT NULL DEFAULT 2,
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
  if (!columnNames.includes('driverSeatCount')) {
    await database.execAsync(
      'ALTER TABLE buses ADD COLUMN driverSeatCount INTEGER NOT NULL DEFAULT 2',
    );
  }

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      deletedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS route_stops (
      id TEXT PRIMARY KEY,
      routeId TEXT NOT NULL,
      name TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      orderNumber INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY (routeId) REFERENCES routes(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_route_stops_routeId ON route_stops(routeId);
    CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops(routeId, orderNumber);
  `);

  const tripColumns = await database.getAllAsync<{ name: string }>(
    "SELECT name FROM pragma_table_info('trips')",
  );
  const tripColumnNames = tripColumns.map((c) => c.name);
  if (!tripColumnNames.includes('routeId')) {
    await database.execAsync('ALTER TABLE trips ADD COLUMN routeId TEXT');
    await database.execAsync('CREATE INDEX IF NOT EXISTS idx_trips_routeId ON trips(routeId)');
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
