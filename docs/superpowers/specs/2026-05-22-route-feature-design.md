# Route Feature Design

**Date:** 2026-05-22
**Status:** Approved

## Overview

Add a Route feature to the app — routes are named sequences of ordered stops that a bus travels through. Routes are managed independently and linked to trips. A trip is started with a selected route (defaulting to the app's default route). During a trip, passengers are associated with the stop they boarded at, and the stop they alight at is recorded when they alight.

## Data Model

### New tables

**`routes`**
```
id          TEXT PRIMARY KEY
name        TEXT NOT NULL
createdAt   INTEGER NOT NULL
updatedAt   INTEGER NOT NULL
deletedAt   INTEGER
```

**`route_stops`**
```
id          TEXT PRIMARY KEY
routeId     TEXT NOT NULL  (FK → routes.id)
name        TEXT NOT NULL
latitude    REAL           (nullable)
longitude   REAL           (nullable)
orderNumber INTEGER NOT NULL
createdAt   INTEGER NOT NULL
updatedAt   INTEGER NOT NULL
```

**`app_settings`**
```
key         TEXT PRIMARY KEY
value       TEXT NOT NULL
```
Used keys: `default_route_id`, `default_bus_id`

### Modified tables

**`trips`**: add nullable `routeId TEXT` (FK → routes.id)

### Modified event data shapes

- `PASSENGER_BOARD` data: gains optional `boardStopId: string`
- `PASSENGER_ALIGHT` data: gains optional `alightStopId: string`

### Indexes

```sql
CREATE INDEX idx_route_stops_routeId ON route_stops(routeId);
CREATE INDEX idx_route_stops_order ON route_stops(routeId, orderNumber);
CREATE INDEX idx_trips_routeId ON trips(routeId);
```

## Navigation

New `RouteStackNavigator` added to the drawer alongside Buses and Trips:

```
RouteList    — list of all routes with default badge
RouteDetail  — route name + draggable stop list (create and edit)
StopForm     — add/edit a single stop (name + optional lat/lng)
```

No changes to `TripStackNavigator` or `BusStackNavigator`. The route/bus selectors on TripFormScreen are inline pickers, not stack pushes.

## New Files

```
src/types/route.ts
src/db/route-repository.ts
src/db/settings-repository.ts
src/navigation/RouteStackNavigator.tsx
src/screens/RouteListScreen.tsx
src/screens/RouteDetailScreen.tsx
src/screens/StopFormScreen.tsx
```

## Screens

### RouteListScreen

- Lists all non-deleted routes showing name and stop count
- The active default route shows a "Default" badge
- "New Route" button navigates to RouteDetailScreen (create mode)
- Tapping a route navigates to RouteDetailScreen (edit mode)

### RouteDetailScreen

- Editable route name field at the top
- Draggable stop list using `react-native-draggable-flatlist`; each row shows order number badge, stop name, and a drag handle
- Dragging re-assigns `orderNumber` values (1-based sequential)
- "Add Stop" button navigates to StopFormScreen
- Tapping a stop row navigates to StopFormScreen (edit mode) with a delete option
- "Set as Default" button writes `default_route_id` to app_settings
- "Delete Route" button soft-deletes the route (sets `deletedAt`)
- Works as both create and edit screen; on create, route is persisted immediately with an empty stop list

### StopFormScreen

Fields: stop name (required), latitude (optional), longitude (optional). Save button is disabled until name is non-empty.

### TripFormScreen (updated)

- Replaces the current bus-only selector with two selectors: Bus and Route
- Both pre-filled from `app_settings` defaults on mount
- Tapping a selector opens a modal picker listing available buses / routes
- If no default is set, selector shows a "Select a route" / "Select a bus" placeholder and Start Trip is disabled until both are selected
- On submit, `routeId` is stored on the trip

### TripDetailScreen — seat action sheet (updated)

**Boarding flow (tapping an empty seat):**
- If the trip has no route: board immediately (existing behavior, unchanged)
- If the trip has a route: tapping an empty seat opens a small boarding sheet showing the route's stop list; conductor taps a stop, then confirms — `boardStopId` is written into the `PASSENGER_BOARD` event data

**Alighting flow (Alight button in occupied-seat action sheet):**
- If the trip has no route: alight immediately (existing behavior, unchanged)
- If the trip has a route: pressing Alight reveals an inline stop list inside the action sheet; conductor selects the alight stop, then confirms — `alightStopId` is written into the `PASSENGER_ALIGHT` event data

The existing 4-button grid (Alight, Cash In, Cash Out, Move) is unchanged in appearance; the stop picker only appears as an extra step gated behind Alight.

### BusDetailScreen (updated)

- Add a "Set as Default Bus" button that writes `default_bus_id` to app_settings

## App Defaults

Stored in `app_settings` (key/value):

| Key | Set from |
|-----|----------|
| `default_route_id` | RouteDetailScreen → "Set as Default" |
| `default_bus_id` | BusDetailScreen → "Set as Default" |

`settings-repository.ts` exposes `getSetting(key)` and `setSetting(key, value)` — simple wrappers over the `app_settings` table.

## Stop Reordering

`react-native-draggable-flatlist` handles drag-to-reorder. On drag end, the new order is reflected immediately in local state and persisted by re-writing all `orderNumber` values for the route (sequential, 1-based) in a single batch update.

## Backward Compatibility

- Existing trips without a `routeId` continue to work — `routeId` is nullable
- Existing `PASSENGER_BOARD` / `PASSENGER_ALIGHT` events without stop IDs are valid — `boardStopId` / `alightStopId` are optional in the data shape
- The stop picker in the seat action sheet is shown only when the trip has an associated route; trips without a route use the existing flow unchanged

## Out of Scope

- Fare calculation based on stop segments (fares remain manually entered)
- Real-time "current stop" tracking at the trip level
- Map view of stops using the lat/lng coordinates
- Route templates or copying routes
