import * as Crypto from 'expo-crypto';
import { Route, RouteFormData, RouteStop, RouteStopFormData, RouteWithStops } from '../types/route';
import { getDatabase } from './database';

export async function getAllRoutes(): Promise<Route[]> {
  const database = await getDatabase();
  return await database.getAllAsync<Route>(
    'SELECT * FROM routes WHERE deletedAt IS NULL ORDER BY createdAt DESC',
  );
}

export async function getRouteById(id: string): Promise<Route | null> {
  const database = await getDatabase();
  const route = await database.getFirstAsync<Route>('SELECT * FROM routes WHERE id = ?', [id]);
  return route ?? null;
}

export async function getRouteWithStops(id: string): Promise<RouteWithStops | null> {
  const database = await getDatabase();
  const route = await database.getFirstAsync<Route>('SELECT * FROM routes WHERE id = ?', [id]);
  if (!route) return null;
  const stops = await database.getAllAsync<RouteStop>(
    'SELECT * FROM route_stops WHERE routeId = ? ORDER BY orderNumber ASC',
    [id],
  );
  return { ...route, stops };
}

export async function createRoute(data: RouteFormData): Promise<Route> {
  const database = await getDatabase();
  const now = Date.now();
  const id = Crypto.randomUUID();

  const route: Route = {
    id,
    name: data.name,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await database.runAsync(
    'INSERT INTO routes (id, name, createdAt, updatedAt, deletedAt) VALUES (?, ?, ?, ?, ?)',
    [route.id, route.name, route.createdAt, route.updatedAt, route.deletedAt],
  );

  return route;
}

export async function updateRoute(id: string, data: Partial<RouteFormData>): Promise<Route | null> {
  const database = await getDatabase();
  const existing = await getRouteById(id);
  if (!existing) return null;

  const now = Date.now();
  const merged: Route = { ...existing, ...data, updatedAt: now };

  await database.runAsync('UPDATE routes SET name = ?, updatedAt = ? WHERE id = ?', [
    merged.name,
    merged.updatedAt,
    id,
  ]);

  return merged;
}

export async function softDeleteRoute(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE routes SET deletedAt = ? WHERE id = ?', [Date.now(), id]);
}

export async function getStopsForRoute(routeId: string): Promise<RouteStop[]> {
  const database = await getDatabase();
  return await database.getAllAsync<RouteStop>(
    'SELECT * FROM route_stops WHERE routeId = ? ORDER BY orderNumber ASC',
    [routeId],
  );
}

export async function createStop(routeId: string, data: RouteStopFormData): Promise<RouteStop> {
  const database = await getDatabase();
  const now = Date.now();
  const id = Crypto.randomUUID();

  const maxOrder = await database.getFirstAsync<{ maxOrder: number | null }>(
    'SELECT MAX(orderNumber) as maxOrder FROM route_stops WHERE routeId = ?',
    [routeId],
  );
  const orderNumber = (maxOrder?.maxOrder ?? 0) + 1;

  const stop: RouteStop = {
    id,
    routeId,
    name: data.name,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    orderNumber,
    createdAt: now,
    updatedAt: now,
  };

  await database.runAsync(
    `INSERT INTO route_stops (id, routeId, name, latitude, longitude, orderNumber, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      stop.id,
      stop.routeId,
      stop.name,
      stop.latitude,
      stop.longitude,
      stop.orderNumber,
      stop.createdAt,
      stop.updatedAt,
    ],
  );

  return stop;
}

export async function updateStop(
  id: string,
  data: Partial<RouteStopFormData>,
): Promise<RouteStop | null> {
  const database = await getDatabase();
  const existing = await database.getFirstAsync<RouteStop>(
    'SELECT * FROM route_stops WHERE id = ?',
    [id],
  );
  if (!existing) return null;

  const now = Date.now();
  const merged: RouteStop = {
    ...existing,
    ...data,
    latitude: data.latitude !== undefined ? data.latitude : existing.latitude,
    longitude: data.longitude !== undefined ? data.longitude : existing.longitude,
    updatedAt: now,
  };

  await database.runAsync(
    `UPDATE route_stops SET name = ?, latitude = ?, longitude = ?, updatedAt = ? WHERE id = ?`,
    [merged.name, merged.latitude, merged.longitude, merged.updatedAt, id],
  );

  return merged;
}

export async function deleteStop(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM route_stops WHERE id = ?', [id]);
}

export async function reorderStops(routeId: string, stopIds: string[]): Promise<void> {
  const database = await getDatabase();
  for (let i = 0; i < stopIds.length; i++) {
    await database.runAsync(
      'UPDATE route_stops SET orderNumber = ?, updatedAt = ? WHERE id = ? AND routeId = ?',
      [i + 1, Date.now(), stopIds[i], routeId],
    );
  }
}
