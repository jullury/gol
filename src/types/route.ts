export interface Route {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export type RouteFormData = Pick<Route, 'name'>;

export interface RouteStop {
  id: string;
  routeId: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  orderNumber: number;
  createdAt: number;
  updatedAt: number;
}

export type RouteStopFormData = Pick<RouteStop, 'name' | 'latitude' | 'longitude'>;

export interface RouteWithStops extends Route {
  stops: RouteStop[];
}
