export interface Trip {
  id: string;
  busId: string;
  startDateTime: number;
  endDateTime: number | null;
  createdAt: number;
}

export type TripFormData = Omit<Trip, 'id' | 'endDateTime' | 'createdAt'>;

export type TripEventType =
  | 'TRIP_START'
  | 'TRIP_END'
  | 'PASSENGER_BOARD'
  | 'PASSENGER_ALIGHT'
  | 'CASH_IN'
  | 'CASH_OUT';

export interface TripEvent {
  id: string;
  tripId: string;
  sequence: number;
  type: TripEventType;
  label: string;
  data: string;
  createdAt: number;
}

export type TripEventInput = Omit<TripEvent, 'id' | 'sequence' | 'createdAt'>;

export interface PassengerState {
  label: string;
  boardedAt: number;
  cashIn: number;
  cashOut: number;
  alightedAt: number | null;
}

export interface TripState {
  trip: Trip;
  events: TripEvent[];
  passengers: Map<string, PassengerState>;
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
}
