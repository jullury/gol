# Bus Minimap Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat seat grid in `TripMinimap.tsx` with an airline-style overhead bus diagram: bus outline, FRONT/BACK bars, driver row with steering wheel, column letters, row numbers, seat numbers on tiles, and a visible aisle divider.

**Architecture:** Single-file rewrite of `src/components/TripMinimap.tsx`. Props interface is unchanged — only the rendering logic and styles change. Seat interaction logic (handleSeatPress, handleTempSeatPress, isDropTarget, etc.) is preserved as-is.

**Tech Stack:** React Native, expo-sqlite app, theme via `useTheme` / `useThemeStyles` from `src/theme`.

---

## Files

- **Modify:** `src/components/TripMinimap.tsx` — complete visual overhaul, logic unchanged

---

## Layout constants (used across all tasks)

```typescript
const SEAT_W = 44;        // seat tile width
const SEAT_H = 30;        // seat tile height
const SEAT_MX = 2;        // horizontal margin on each seat tile
const AISLE_W = 20;       // aisle divider column width
const ROW_LABEL_W = 28;   // left row-number column width
const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
```

Place these as module-level constants just above the component function.

---

## Task 1: Add layout constants and `renderSeatTile` helper

**Files:**
- Modify: `src/components/TripMinimap.tsx`

- [ ] **Step 1: Add module-level constants**

  Open `src/components/TripMinimap.tsx`. After the import block and before `const MAX_TEMP_SEATS = 8;`, add:

  ```typescript
  const SEAT_W = 44;
  const SEAT_H = 30;
  const SEAT_MX = 2;
  const AISLE_W = 20;
  const ROW_LABEL_W = 28;
  const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  ```

- [ ] **Step 2: Add `renderSeatTile` inside the component**

  Inside `TripMinimap`, after the `isTempDropTarget` function and before `handleSeatPress`, add:

  ```typescript
  function renderSeatTile(seatNum: number) {
    const occupied = occupiedSeats.has(seatNum);
    const isSelected = selectedSeatLabel === seatNum.toString();
    const isTarget = isDropTarget(seatNum);

    let bg = occupied ? colors.primary : colors.successBg;
    let topColor = occupied ? colors.primaryDark : colors.successBorder;
    let textColor = occupied ? colors.text.inverse : colors.success;
    let frameBorder: object = {};

    if (isSelected) {
      bg = colors.warningBg;
      textColor = colors.warningText;
      frameBorder = {
        borderWidth: 2,
        borderColor: colors.warningBorder,
        borderStyle: 'solid' as const,
      };
    } else if (isTarget) {
      bg = colors.dropTargetBg;
      textColor = colors.success;
      frameBorder = {
        borderWidth: 2,
        borderColor: colors.dropTargetBorder,
        borderStyle: 'dashed' as const,
      };
    }

    return (
      <TouchableOpacity
        key={seatNum}
        activeOpacity={0.7}
        onPress={() => handleSeatPress(seatNum)}
        style={[styles.seatTile, { backgroundColor: bg, borderTopColor: topColor }, frameBorder]}
      >
        <Text style={[styles.seatNum, { color: textColor }]}>{seatNum}</Text>
      </TouchableOpacity>
    );
  }
  ```

- [ ] **Step 3: Verify lint passes**

  ```bash
  pnpm run lint
  ```

  Expected: 0 errors (existing warnings OK).

---

## Task 2: `renderDriverRow`

**Files:**
- Modify: `src/components/TripMinimap.tsx`

- [ ] **Step 1: Add `renderDriverRow` inside the component**

  Add this function after `renderSeatTile`:

  ```typescript
  function renderDriverRow() {
    const passengerSeats = Array.from({ length: driverSeatCount }, (_, i) => i + 1);
    return (
      <View style={styles.driverRow}>
        {/* Steering wheel */}
        <View style={styles.steeringWheel}>
          <View style={styles.steeringHub} />
        </View>

        {/* Driver seat — not tappable */}
        <View style={[styles.seatTile, styles.driverSeatTile]}>
          <Text style={[styles.seatNum, styles.driverSeatNum]}>D</Text>
        </View>

        {/* Push passenger seats to the right */}
        <View style={{ flex: 1 }} />

        {/* Numbered passenger seats next to driver */}
        {passengerSeats.map((seatNum) => renderSeatTile(seatNum))}
      </View>
    );
  }
  ```

- [ ] **Step 2: Verify lint**

  ```bash
  pnpm run lint
  ```

  Expected: 0 errors.

---

## Task 3: Column headers and seat rows

**Files:**
- Modify: `src/components/TripMinimap.tsx`

- [ ] **Step 1: Compute aisle split and add `renderColumnHeaders`**

  Add after `renderDriverRow`, still inside the component. The aisle split and `cols`/`rows` values are already computed at the top of the component (`const cols = seatColumns > 0 ? seatColumns : 5;`):

  ```typescript
  const aisleAfterCol = Math.floor(cols / 2);
  const leftColCount = aisleAfterCol;
  const rightColCount = cols - aisleAfterCol;

  function renderColumnHeaders() {
    return (
      <View style={styles.headerRow}>
        <View style={{ width: ROW_LABEL_W }} />
        {Array.from({ length: leftColCount }, (_, c) => (
          <View key={`lh-${c}`} style={styles.colHeader}>
            <Text style={styles.colHeaderText}>{COL_LETTERS[c]}</Text>
          </View>
        ))}
        <View style={{ width: AISLE_W }} />
        {Array.from({ length: rightColCount }, (_, c) => (
          <View key={`rh-${c}`} style={styles.colHeader}>
            <Text style={styles.colHeaderText}>{COL_LETTERS[leftColCount + c]}</Text>
          </View>
        ))}
      </View>
    );
  }
  ```

  > **Note:** `aisleAfterCol`, `leftColCount`, `rightColCount` must be declared before `renderColumnHeaders` and `renderSeatRows` — place them in the component body before those functions.

- [ ] **Step 2: Add `renderSeatRows`**

  Add after `renderColumnHeaders`:

  ```typescript
  function renderSeatRows() {
    const result: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      result.push(
        <View key={`row-${r}`} style={styles.seatRow}>
          <Text style={styles.rowLabel}>{r + 1}</Text>
          {Array.from({ length: leftColCount }, (_, c) =>
            renderSeatTile(gridStart + r * cols + c)
          )}
          <View style={styles.aisleGap}>
            <Text style={styles.aisleText}>│</Text>
          </View>
          {Array.from({ length: rightColCount }, (_, c) =>
            renderSeatTile(gridStart + r * cols + (leftColCount + c))
          )}
        </View>,
      );
    }
    return result;
  }
  ```

- [ ] **Step 3: Verify lint**

  ```bash
  pnpm run lint
  ```

  Expected: 0 errors.

---

## Task 4: Temp seat tiles

**Files:**
- Modify: `src/components/TripMinimap.tsx`

- [ ] **Step 1: Add `renderTempSeatTile` inside the component**

  Add after `renderSeatRows`:

  ```typescript
  function renderTempSeatTile(tempLabel: string) {
    const occupied = occupiedTempSet.has(tempLabel);
    const isSelected = selectedSeatLabel === tempLabel;
    const isTarget = isTempDropTarget(tempLabel);
    const display = `T${tempLabel.slice(5)}`; // "temp-3" → "T3"

    let bg = occupied ? colors.primary : colors.successBg;
    let textColor = occupied ? colors.text.inverse : colors.success;
    let frameBorder: object = {};

    if (isSelected) {
      bg = colors.warningBg;
      textColor = colors.warningText;
      frameBorder = { borderWidth: 2, borderColor: colors.warningBorder, borderStyle: 'solid' as const };
    } else if (isTarget) {
      bg = colors.dropTargetBg;
      textColor = colors.success;
      frameBorder = { borderWidth: 2, borderColor: colors.dropTargetBorder, borderStyle: 'dashed' as const };
    }

    return (
      <TouchableOpacity
        key={tempLabel}
        activeOpacity={0.7}
        onPress={() => handleTempSeatPress(tempLabel)}
        style={[styles.seatTile, styles.tempTile, { backgroundColor: bg }, frameBorder]}
      >
        <Text style={[styles.seatNum, { color: textColor }]}>{display}</Text>
      </TouchableOpacity>
    );
  }
  ```

- [ ] **Step 2: Verify lint**

  ```bash
  pnpm run lint
  ```

  Expected: 0 errors.

---

## Task 5: Replace the `return` JSX and all styles

**Files:**
- Modify: `src/components/TripMinimap.tsx`

This is the biggest step — replace everything from the `return (` statement to the end of the file.

- [ ] **Step 1: Replace the return block**

  Find the `return (` line in the component and replace everything from there to the closing `);` of the component with:

  ```tsx
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seat Map</Text>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Occupied ({occupiedCount})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successBorder }]} />
          <Text style={styles.legendText}>Free ({freeSeatsCount})</Text>
        </View>
      </View>

      {selectedSeatLabel !== null && (
        <Text style={styles.moveHint}>
          Tap a free seat to move passenger, or tap the selected seat to cancel.
        </Text>
      )}

      {/* Bus outline */}
      <View style={styles.busOutline}>
        {/* FRONT */}
        <View style={styles.frontBar}>
          <Text style={styles.frontText}>▲  FRONT</Text>
        </View>

        {/* Driver row */}
        {renderDriverRow()}

        {/* Divider */}
        <View style={styles.sectionDivider} />

        {/* Scrollable grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.gridInner}>
            {renderColumnHeaders()}
            {renderSeatRows()}
          </View>
        </ScrollView>

        {/* BACK */}
        <View style={styles.backBar}>
          <Text style={styles.backText}>BACK</Text>
        </View>
      </View>

      {/* Temp / overflow seats */}
      {showTempSeats && (
        <View style={styles.tempSection}>
          <Text style={styles.tempTitle}>Temporary Seats</Text>
          <View style={styles.tempRow}>
            {Array.from({ length: MAX_TEMP_SEATS }, (_, i) =>
              renderTempSeatTile(`temp-${i + 1}`)
            )}
          </View>
        </View>
      )}
    </View>
  );
  ```

- [ ] **Step 2: Replace `createStyles`**

  Delete everything from `const createStyles = ` to the end of the file and replace with:

  ```typescript
  const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 18,
      fontWeight: '700' as const,
      fontFamily: fonts.bold,
      color: colors.text.primary,
      marginBottom: 8,
    },
    legend: {
      flexDirection: 'row' as const,
      gap: 16,
      marginBottom: 12,
    },
    legendItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 12,
      color: colors.text.muted,
    },
    moveHint: {
      fontSize: 12,
      fontWeight: '600' as const,
      fontStyle: 'italic' as const,
      color: colors.warning,
      marginBottom: 10,
    },
    // Bus outline
    busOutline: {
      borderWidth: 2,
      borderColor: colors.borderLight,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
      overflow: 'hidden' as const,
    },
    frontBar: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      alignItems: 'center' as const,
    },
    frontText: {
      color: colors.text.inverse,
      fontSize: 11,
      fontWeight: '700' as const,
      letterSpacing: 2,
    },
    driverRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.warningBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.warningBorder,
      gap: 6,
    },
    steeringWheel: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2.5,
      borderColor: colors.warningText,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    steeringHub: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.warningText,
    },
    driverSeatTile: {
      backgroundColor: colors.warningBg,
      borderTopColor: colors.warningBorder,
    },
    driverSeatNum: {
      color: colors.warningText,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    gridInner: {
      paddingBottom: 6,
    },
    // Column headers
    headerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingTop: 6,
      paddingBottom: 2,
      backgroundColor: colors.surfaceAlt,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    colHeader: {
      width: SEAT_W,
      marginHorizontal: SEAT_MX,
      alignItems: 'center' as const,
    },
    colHeaderText: {
      fontSize: 9,
      fontWeight: '700' as const,
      color: colors.text.disabled,
      letterSpacing: 1,
    },
    // Seat rows
    seatRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 3,
    },
    rowLabel: {
      width: ROW_LABEL_W,
      fontSize: 9,
      fontWeight: '700' as const,
      color: colors.text.disabled,
      textAlign: 'right' as const,
      paddingRight: 6,
    },
    aisleGap: {
      width: AISLE_W,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    aisleText: {
      fontSize: 14,
      color: colors.border,
    },
    // Seat tile base — free state
    seatTile: {
      width: SEAT_W,
      height: SEAT_H,
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
      borderBottomLeftRadius: 3,
      borderBottomRightRadius: 3,
      borderTopWidth: 3,
      borderTopColor: colors.successBorder,
      backgroundColor: colors.successBg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginHorizontal: SEAT_MX,
    },
    seatNum: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: colors.success,
    },
    // Temp tile — adds dashed purple outer border
    tempTile: {
      borderWidth: 1.5,
      borderColor: '#a855f7',
      borderStyle: 'dashed' as const,
      borderTopWidth: 3,
      borderTopColor: colors.successBorder,
    },
    // Back bar
    backBar: {
      backgroundColor: colors.surfaceAlt,
      paddingVertical: 5,
      alignItems: 'center' as const,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    backText: {
      fontSize: 9,
      fontWeight: '600' as const,
      color: colors.text.disabled,
      letterSpacing: 2,
    },
    // Temp section (below bus outline)
    tempSection: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    tempTitle: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.text.muted,
      marginBottom: 8,
    },
    tempRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 6,
    },
  });
  ```

- [ ] **Step 3: Run lint**

  ```bash
  pnpm run lint
  ```

  Expected: 0 errors.

---

## Task 6: Apply occupied/selected/target overrides inline and wire up `freeSeatsCount` / `occupiedCount`

The `seatTile` base style is the *free* state. Occupied and interactive states are applied as inline overrides in `renderSeatTile` (already done in Task 1). Two values from the existing component top need to be verified still present:

- [ ] **Step 1: Confirm `occupiedCount` and `freeSeatsCount` are still computed**

  The existing component already computes these:
  ```typescript
  const occupiedCount = occupiedSeats.size;
  const freeSeatsCount = totalSeats - occupiedCount;
  ```
  Confirm both lines are still present in the component body (they were not removed — just verify).

- [ ] **Step 2: Verify `gridStart` is still declared**

  The existing line:
  ```typescript
  const gridStart = 1 + driverSeatCount;
  ```
  must still be present (used in `renderSeatRows`). Confirm it is.

- [ ] **Step 3: Remove the old `renderGrid`, `renderDriverSeats`, `renderTempSeats` functions**

  Delete the old function bodies — they are now replaced by `renderSeatTile`, `renderDriverRow`, `renderColumnHeaders`, `renderSeatRows`, `renderTempSeatTile`. Leaving them causes dead-code lint warnings.

- [ ] **Step 4: Run lint**

  ```bash
  pnpm run lint
  ```

  Expected: 0 errors.

---

## Task 7: Final verification and commit

- [ ] **Step 1: Run format check**

  ```bash
  pnpm run format:check
  ```

  If it fails, run `pnpm run format` to auto-fix, then re-check.

- [ ] **Step 2: Visual check in the app**

  Start the dev server:
  ```bash
  pnpm run start
  ```
  Open a trip detail screen and verify:
  - Dark green FRONT bar at top of seat map
  - Steering wheel circle + amber D seat + numbered driver-side passenger seats (1, 2…)
  - Dashed divider between driver row and main grid
  - Column letters (A, B, │, C, D) above the grid
  - Row numbers (1, 2, 3…) on the left of each row
  - Each seat shows its number; green = free, dark green = occupied
  - Tap occupied seat → seat action sheet appears
  - Tap free seat → passenger boarded immediately (no sheet)
  - In move mode: selected seat is amber, free destination seats have dashed green frame
  - BACK bar at bottom

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/TripMinimap.tsx
  git commit -m "feat: redesign TripMinimap as airline-style overhead bus diagram"
  ```
