# Bus Minimap Redesign

**Date:** 2026-05-22  
**Status:** Approved  
**File:** `src/components/TripMinimap.tsx`

## Goal

Replace the current flat grid of seat tiles with an airline-style overhead bus diagram that reads like a real vehicle: rounded bus outline, labelled front/back, column letters, row numbers, seat numbers printed on each seat, and a visible aisle divider.

## Visual Design

### Overall Structure (top → bottom)

```
┌─────────────────────┐
│      ▲ FRONT        │  ← light blue gradient bar
├─────────────────────┤
│ 🔘  D  │  [1] [2]  │  ← driver row (amber bg, dashed bottom border)
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  ← dashed divider
│      A  B  │  C  D  │  ← column headers (grey, letter labels)
├─────────────────────┤
│ 1  [3] [4] │ [5] [6]│  ← seat rows, row number on left
│ 2  [7] [8] │ [9][10]│
│ …                   │
├─────────────────────┤
│         BACK        │  ← light grey bar
└─────────────────────┘
```

### Driver Row

- Yellow/amber background (`colors.warningBg`), bottom border dashed
- Left side: steering wheel SVG-style circle (not tappable)
- Next: amber "D" seat tile (driver — not tappable)
- Right side (pushed to right with `flex:1` spacer): `driverSeatCount` numbered passenger seats (seats 1…N), same tile style as the main grid, fully tappable
- If `driverSeatCount === 0`, render only the steering wheel + D tile; omit the passenger seats

### Column Headers

- Displayed between the driver row divider and the first seat row
- Left offset of `rowLabelWidth` (24 px) to align with seat columns
- Column letters: A, B, …, derived from `seatColumns`
- Aisle column shown as a centre `│` character (no letter), not counted in seat numbering
- Aisle splits columns at `Math.floor(seatColumns / 2)` left / rest right

### Seat Rows

- Row label (1, 2, 3…) on the left in `rowLabelWidth`
- Each row renders left group + aisle divider (`│`, non-interactive) + right group
- Seat tile dimensions: 44 × 30 px, `border-radius: 5px 5px 3px 3px`, thick top border (3 px) = headrest suggestion
- Seat number printed centred on the tile (font-size 10–11 px, bold)
- Seat numbering: driver seats occupy 1…driverSeatCount; grid seats start at driverSeatCount + 1, numbered left-to-right, top-to-bottom

### Seat Tile States

| State | Background | Top border | Text colour | Additional border |
|---|---|---|---|---|
| Free | `colors.successBg` (`#dcfce7`) | `#bbf7d0` | `colors.success` (`#166534`) | — |
| Occupied | `colors.primary` (`#166534`) | `#14532d` | `colors.text.inverse` (white) | — |
| Selected (move mode) | `colors.accentLight` (`#fef3c7`) | `#f59e0b` | `#92400e` | 2 px solid amber |
| Drop target | `#eff6ff` | — | `#1d4ed8` | 2 px dashed blue |

### Temp / Overflow Seats

- Shown in a section below the main grid, separated by a border, only when `tempSeats.length > 0` or move mode is active with no free seats
- Same tile dimensions as regular seats
- Always have a 1.5 px purple dashed outer border
- Free temp slot: `successBg` background, purple text label (T1, T2…)
- Occupied temp slot: `primary` background, white text label

### Bus Outline

- `border: 2px solid colors.border`
- `border-radius: 16px 16px 6px 6px` (rounded at front/top)
- White background, light shadow (`elevation: 3`)
- FRONT bar: light blue gradient, "▲ FRONT" centred label
- BACK bar: light grey, "BACK" centred label

## Props Interface (unchanged)

No props change. The existing interface stays:

```typescript
interface TripMinimapProps {
  seatColumns: number;
  seatRows: number;
  driverSeatCount: number;
  occupiedSeats: Set<number>;
  onMovePassenger: (fromSeatId: string, toSeatId: string) => void;
  onBoardSeat: (seatId: string) => void;
  onOccupiedSeatTap: (seatId: string) => void;
  tempSeats: string[];
  selectedSeatLabel: string | null;
  onSeatSelect: (label: string | null) => void;
}
```

## Interaction Behaviour (unchanged)

- Tapping a **free** seat (not in move mode) → `onBoardSeat(seatId)`
- Tapping an **occupied** seat (not in move mode) → `onOccupiedSeatTap(seatId)`
- In move mode (`selectedSeatLabel !== null`):
  - Tap selected seat → cancel (`onSeatSelect(null)`)
  - Tap free seat → `onMovePassenger(selectedSeatLabel, targetSeatId)` + deselect
  - Tap occupied seat → no-op
- Move hint text shown below column headers when in move mode
- Driver "D" tile and steering wheel: non-tappable, no press handler

## Aisle Position

`aisleAfterCol = Math.floor(seatColumns / 2)`

Examples:
- 4 columns → 2 left (A, B) + 2 right (C, D)  
- 5 columns → 2 left (A, B) + 3 right (C, D, E)
- 2 columns → 1 left (A) + 1 right (B)

## Scrolling

Wrap the minimap body (driver row + headers + seat grid) in a horizontal `ScrollView` so wide buses (many columns) don't overflow. The bus outline container itself does not scroll.

## Out of Scope

- Seat colour theming / custom seat colours
- Deck-level (double-decker) support
- Door position rendering
- Seat labels other than sequential numbers
