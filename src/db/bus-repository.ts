import * as Crypto from 'expo-crypto';
import { Bus, BusFormData } from '../types/bus';
import { getDatabase } from './database';

export async function getAllBuses(filter?: 'active' | 'deleted'): Promise<Bus[]> {
  const database = await getDatabase();

  let query = 'SELECT * FROM buses';
  const params: (string | number)[] = [];

  if (filter === 'active') {
    query += ' WHERE deletedAt IS NULL';
  } else if (filter === 'deleted') {
    query += ' WHERE deletedAt IS NOT NULL';
  }

  query += ' ORDER BY createdAt DESC';

  return await database.getAllAsync(query, params);
}

export async function getBusById(id: string): Promise<Bus | null> {
  const database = await getDatabase();
  const bus = await database.getFirstAsync<Bus>('SELECT * FROM buses WHERE id = ?', [id]);
  return bus ?? null;
}

export async function createBus(data: BusFormData): Promise<Bus> {
  const database = await getDatabase();
  const now = Date.now();
  const id = Crypto.randomUUID();

  const numberOfPlace = data.seatColumns * data.seatRows + data.driverSeatCount;

  const bus: Bus = {
    id,
    numero: data.numero,
    name: data.name,
    numberOfPlace,
    seatColumns: data.seatColumns,
    seatRows: data.seatRows,
    driverSeatCount: data.driverSeatCount,
    photo1: data.photo1 ?? null,
    photo2: data.photo2 ?? null,
    photo3: data.photo3 ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await database.runAsync(
    `INSERT INTO buses (id, numero, name, numberOfPlace, seatColumns, seatRows, driverSeatCount, photo1, photo2, photo3, createdAt, updatedAt, deletedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bus.id,
      bus.numero,
      bus.name,
      bus.numberOfPlace,
      bus.seatColumns,
      bus.seatRows,
      bus.driverSeatCount,
      bus.photo1,
      bus.photo2,
      bus.photo3,
      bus.createdAt,
      bus.updatedAt,
      bus.deletedAt,
    ],
  );

  return bus;
}

export async function updateBus(id: string, data: Partial<BusFormData>): Promise<Bus | null> {
  const database = await getDatabase();

  const existing = await getBusById(id);
  if (!existing) return null;

  const updatedAt = Date.now();

  const merged: Bus = {
    ...existing,
    ...data,
    updatedAt,
  };
  merged.photo1 = data.photo1 !== undefined ? data.photo1 : existing.photo1;
  merged.photo2 = data.photo2 !== undefined ? data.photo2 : existing.photo2;
  merged.photo3 = data.photo3 !== undefined ? data.photo3 : existing.photo3;

  merged.numberOfPlace =
    data.seatColumns !== undefined && data.seatRows !== undefined
      ? data.seatColumns * data.seatRows + (data.driverSeatCount ?? existing.driverSeatCount ?? 2)
      : existing.numberOfPlace;
  merged.seatColumns = data.seatColumns ?? existing.seatColumns;
  merged.seatRows = data.seatRows ?? existing.seatRows;
  merged.driverSeatCount = data.driverSeatCount ?? existing.driverSeatCount;

  await database.runAsync(
    `UPDATE buses SET numero = ?, name = ?, numberOfPlace = ?, seatColumns = ?, seatRows = ?, driverSeatCount = ?, photo1 = ?, photo2 = ?, photo3 = ?, updatedAt = ? WHERE id = ?`,
    [
      merged.numero,
      merged.name,
      merged.numberOfPlace,
      merged.seatColumns,
      merged.seatRows,
      merged.driverSeatCount,
      merged.photo1,
      merged.photo2,
      merged.photo3,
      merged.updatedAt,
      id,
    ],
  );

  return merged;
}

export async function softDeleteBus(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE buses SET deletedAt = ? WHERE id = ?', [Date.now(), id]);
}

export async function restoreBus(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE buses SET deletedAt = NULL WHERE id = ?', [id]);
}
