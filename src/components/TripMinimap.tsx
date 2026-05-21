import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme, useThemeStyles } from '../theme';

interface TripMinimapProps {
  seatColumns: number;
  seatRows: number;
  driverSeatCount: number;
  occupiedSeats: Set<number>;
  onMovePassenger: (fromLabel: string, toLabel: string) => void;
  onBoardSeat: (label: string) => void;
  onOccupiedSeatTap: (label: string) => void;
  tempSeats: string[];
  selectedSeatLabel: string | null;
  onSeatSelect: (label: string | null) => void;
}

const TEMP_SEAT_BORDER = '#a855f7';

const SEAT_W = 44;
const SEAT_H = 30;
const SEAT_MX = 2;
const AISLE_W = 20;
const ROW_LABEL_W = 28;
const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const MAX_TEMP_SEATS = 8;

export default function TripMinimap({
  seatColumns,
  seatRows,
  driverSeatCount,
  occupiedSeats,
  onMovePassenger,
  onBoardSeat,
  onOccupiedSeatTap,
  tempSeats,
  selectedSeatLabel,
  onSeatSelect,
}: TripMinimapProps) {
  const { colors, fonts } = useTheme();
  const styles = useThemeStyles(createStyles);

  const cols = seatColumns > 0 ? seatColumns : 5;
  const rows = seatRows > 0 ? seatRows : 4;
  const gridStart = 1 + driverSeatCount;
  const totalSeats = cols * rows + driverSeatCount;
  const occupiedCount = occupiedSeats.size;
  const freeSeatsCount = totalSeats - occupiedCount;

  const occupiedTempSet = useMemo(() => new Set(tempSeats), [tempSeats]);

  const showTempSeats =
    (selectedSeatLabel !== null && freeSeatsCount === 0) || tempSeats.length > 0;

  const aisleAfterCol = Math.floor(cols / 2);
  const leftColCount = aisleAfterCol;
  const rightColCount = cols - aisleAfterCol;

  function isDropTarget(seatNum: number): boolean {
    if (!selectedSeatLabel) return false;
    const label = seatNum.toString();
    if (label === selectedSeatLabel) return false;
    return !occupiedSeats.has(seatNum);
  }

  function isTempDropTarget(tempLabel: string): boolean {
    if (!selectedSeatLabel) return false;
    if (tempLabel === selectedSeatLabel) return false;
    return !occupiedTempSet.has(tempLabel);
  }

  function handleSeatPress(seatNum: number) {
    const label = seatNum.toString();

    if (selectedSeatLabel === null) {
      if (occupiedSeats.has(seatNum)) {
        onOccupiedSeatTap(label);
      } else {
        onBoardSeat(label);
      }
    } else {
      if (label === selectedSeatLabel) {
        onSeatSelect(null);
      } else if (isDropTarget(seatNum)) {
        onMovePassenger(selectedSeatLabel, label);
        onSeatSelect(null);
      }
    }
  }

  function handleTempSeatPress(tempLabel: string) {
    if (selectedSeatLabel === null) {
      if (occupiedTempSet.has(tempLabel)) {
        onOccupiedSeatTap(tempLabel);
      } else {
        onBoardSeat(tempLabel);
      }
    } else {
      if (tempLabel === selectedSeatLabel) {
        onSeatSelect(null);
      } else if (isTempDropTarget(tempLabel)) {
        onMovePassenger(selectedSeatLabel, tempLabel);
        onSeatSelect(null);
      }
    }
  }

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
      topColor = colors.warningBorder;
      textColor = colors.warningText;
      frameBorder = {
        borderWidth: 2,
        borderColor: colors.warningBorder,
        borderStyle: 'solid' as const,
      };
    } else if (isTarget) {
      bg = colors.dropTargetBg;
      topColor = colors.dropTargetBorder;
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

  function renderDriverRow() {
    if (driverSeatCount === 0) return null;
    const passengerSeats = Array.from({ length: driverSeatCount }, (_, i) => i + 1);
    return (
      <View style={styles.driverRow}>
        <View style={styles.steeringWheel}>
          <View style={styles.steeringHub} />
        </View>
        <View style={[styles.seatTile, styles.driverSeatTile]}>
          <Text style={[styles.seatNum, styles.driverSeatNum]}>D</Text>
        </View>
        <View style={{ flex: 1 }} />
        {passengerSeats.map((seatNum) => renderSeatTile(seatNum))}
      </View>
    );
  }

  function renderColumnHeaders() {
    return (
      <View style={styles.headerRow}>
        <View style={{ width: ROW_LABEL_W }} />
        {Array.from({ length: leftColCount }, (_, c) => (
          <View key={`lh-${c}`} style={styles.colHeader}>
            <Text style={styles.colHeaderText}>{COL_LETTERS[c]}</Text>
          </View>
        ))}
        {leftColCount > 0 && <View style={{ width: AISLE_W }} />}
        {Array.from({ length: rightColCount }, (_, c) => (
          <View key={`rh-${c}`} style={styles.colHeader}>
            <Text style={styles.colHeaderText}>{COL_LETTERS[leftColCount + c]}</Text>
          </View>
        ))}
      </View>
    );
  }

  function renderSeatRows() {
    const result: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      result.push(
        <View key={`row-${r}`} style={styles.seatRow}>
          <Text style={styles.rowLabel}>{r + 1}</Text>
          {Array.from({ length: leftColCount }, (_, c) => renderSeatTile(gridStart + r * cols + c))}
          {leftColCount > 0 && (
            <View style={styles.aisleGap}>
              <Text style={styles.aisleText}>│</Text>
            </View>
          )}
          {Array.from({ length: rightColCount }, (_, c) =>
            renderSeatTile(gridStart + r * cols + (leftColCount + c)),
          )}
        </View>,
      );
    }
    return result;
  }

  function renderTempSeatTile(tempLabel: string) {
    const occupied = occupiedTempSet.has(tempLabel);
    const isSelected = selectedSeatLabel === tempLabel;
    const isTarget = isTempDropTarget(tempLabel);
    const display = `T${tempLabel.slice(5)}`;

    let bg = occupied ? colors.primary : colors.successBg;
    let topColor = occupied ? colors.primaryDark : colors.successBorder;
    let textColor = occupied ? colors.text.inverse : colors.success;
    let frameBorder: object = {};

    if (isSelected) {
      bg = colors.warningBg;
      topColor = colors.warningBorder;
      textColor = colors.warningText;
      frameBorder = {
        borderWidth: 2,
        borderColor: colors.warningBorder,
        borderStyle: 'solid' as const,
      };
    } else if (isTarget) {
      bg = colors.dropTargetBg;
      topColor = colors.dropTargetBorder;
      textColor = colors.success;
      frameBorder = {
        borderWidth: 2,
        borderColor: colors.dropTargetBorder,
        borderStyle: 'dashed' as const,
      };
    }

    return (
      <TouchableOpacity
        key={tempLabel}
        activeOpacity={0.7}
        onPress={() => handleTempSeatPress(tempLabel)}
        style={[
          styles.seatTile,
          styles.tempTile,
          { backgroundColor: bg, borderTopColor: topColor },
          frameBorder,
        ]}
      >
        <Text style={[styles.seatNum, { color: textColor }]}>{display}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Seat Map</Text>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Occupied ({occupiedCount})</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: colors.successBg,
                borderWidth: 1,
                borderColor: colors.successBorder,
              },
            ]}
          />
          <Text style={styles.legendText}>Free ({freeSeatsCount})</Text>
        </View>
      </View>

      {selectedSeatLabel !== null && (
        <Text style={styles.moveHint}>
          Tap a free seat to move passenger, or tap the selected seat to cancel.
        </Text>
      )}

      <View style={styles.busOutline}>
        <View style={styles.frontBar}>
          <Text style={styles.frontText}>▲ FRONT</Text>
        </View>

        {renderDriverRow()}

        <View style={styles.sectionDivider} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.gridInner}>
            {renderColumnHeaders()}
            {renderSeatRows()}
          </View>
        </ScrollView>

        <View style={styles.backBar}>
          <Text style={styles.backText}>BACK</Text>
        </View>
      </View>

      {showTempSeats && (
        <View style={styles.tempSection}>
          <Text style={styles.tempTitle}>Temporary Seats</Text>
          <View style={styles.tempRow}>
            {Array.from({ length: MAX_TEMP_SEATS }, (_, i) => renderTempSeatTile(`temp-${i + 1}`))}
          </View>
        </View>
      )}
    </View>
  );
}

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
  tempTile: {
    borderWidth: 1.5,
    borderColor: TEMP_SEAT_BORDER,
    borderStyle: 'dashed' as const,
    borderTopWidth: 3,
    borderTopColor: colors.successBorder,
  },
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
