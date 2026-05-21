import { v4 as uuidv4 } from 'uuid';
import { Trip, TripFormData, TripEvent, TripEventInput, TripEventType, TripState, PassengerState } from '../types/trip';
import { getDatabase } from './database';

export async function getAllTrips(filter?: 'active' | 'completed'): Promise<Trip[]> {
  const database = await getDatabase();

  let query = 'SELECT * FROM trips';
  const params: (string | number)[] = [];

  if (filter === 'active') {
    query += ' WHERE endDateTime IS NULL';
  } else if (filter === 'completed') {
    query += ' WHERE endDateTime IS NOT NULL';
  }

  query += ' ORDER BY startDateTime DESC';

  return await database.getAllAsync(query, params);
}

export async function getTripById(id: string): Promise<Trip | null> {
  const database = await getDatabase();
  const trip = await database.getFirstAsync<Trip>('SELECT * FROM trips WHERE id = ?', [id]);
  return trip ?? null;
}

export async function getActiveTripForBus(busId: string): Promise<Trip | null> {
  const database = await getDatabase();
  const trip = await database.getFirstAsync<Trip>(
    `SELECT * FROM trips WHERE busId = ? AND endDateTime IS NULL ORDER BY startDateTime DESC LIMIT 1`,
    [busId],
  );
  return trip ?? null;
}

export async function hasActiveTrip(busId: string): Promise<boolean> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM trips WHERE busId = ? AND endDateTime IS NULL`,
    [busId],
  );
  return (row?.count ?? 0) > 0;
}

export async function createTrip(data: TripFormData): Promise<Trip> {
  const database = await getDatabase();
  const now = Date.now();
  const id = uuidv4();

  const trip: Trip = {
    id,
    busId: data.busId,
    startDateTime: data.startDateTime,
    endDateTime: null,
    createdAt: now,
  };

  await database.runAsync(
    `INSERT INTO trips (id, busId, startDateTime, endDateTime, createdAt) VALUES (?, ?, ?, ?, ?)`,
    [trip.id, trip.busId, trip.startDateTime, trip.endDateTime, trip.createdAt],
  );

  return trip;
}

export async function endTrip(id: string): Promise<Trip | null> {
  const database = await getDatabase();
  const existing = await getTripById(id);
  if (!existing) return null;

  const now = Date.now();
  await database.runAsync('UPDATE trips SET endDateTime = ? WHERE id = ?', [now, id]);
  return { ...existing, endDateTime: now };
}

// Event store

export async function addTripEvent(input: TripEventInput): Promise<TripEvent> {
  const database = await getDatabase();
  const id = uuidv4();
  const now = Date.now();

  const maxSeq = await database.getFirstAsync<{ maxSeq: number | null }>(
    'SELECT MAX(sequence) as maxSeq FROM trip_events WHERE tripId = ?',
    [input.tripId],
  );
  const sequence = (maxSeq?.maxSeq ?? 0) + 1;

  const event: TripEvent = {
    id,
    tripId: input.tripId,
    sequence,
    type: input.type,
    label: input.label,
    data: input.data,
    createdAt: now,
  };

  await database.runAsync(
    `INSERT INTO trip_events (id, tripId, sequence, type, label, data, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [event.id, event.tripId, event.sequence, event.type, event.label, event.data, event.createdAt],
  );

  return event;
}

export async function getTripEvents(tripId: string): Promise<TripEvent[]> {
  const database = await getDatabase();
  return await database.getAllAsync<TripEvent>(
    'SELECT * FROM trip_events WHERE tripId = ? ORDER BY sequence ASC',
    [tripId],
  );
}

// State reconstruction

export async function getTripState(tripId: string): Promise<TripState | null> {
  const trip = await getTripById(tripId);
  if (!trip) return null;

  const events = await getTripEvents(tripId);
  return reconstructState(trip, events);
}

export function reconstructState(trip: Trip, events: TripEvent[]): TripState {
  const passengers = new Map<string, PassengerState>();
  let totalCashIn = 0;
  let totalCashOut = 0;

  for (const event of events) {
    switch (event.type) {
      case 'PASSENGER_BOARD': {
        const parsed = JSON.parse(event.data);
        const label = event.label;
        passengers.set(label, {
          label,
          boardedAt: event.createdAt,
          cashIn: 0,
          cashOut: 0,
          alightedAt: null,
        });
        break;
      }
      case 'CASH_IN': {
        const parsed = JSON.parse(event.data);
        const label = event.label;
        const passenger = passengers.get(label);
        if (passenger) {
          passenger.cashIn += parsed.amount;
        }
        totalCashIn += parsed.amount;
        break;
      }
      case 'CASH_OUT': {
        const parsed = JSON.parse(event.data);
        const label = event.label;
        const passenger = passengers.get(label);
        if (passenger) {
          passenger.cashOut += parsed.amount;
        }
        totalCashOut += parsed.amount;
        break;
      }
      case 'PASSENGER_ALIGHT': {
        const label = event.label;
        const passenger = passengers.get(label);
        if (passenger) {
          passenger.alightedAt = event.createdAt;
        }
        break;
      }
      default:
        break;
    }
  }

  const netCashFlow = totalCashIn - totalCashOut;

  return {
    trip,
    events,
    passengers,
    totalCashIn,
    totalCashOut,
    netCashFlow,
  };
}
