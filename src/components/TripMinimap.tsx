import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme, useThemeStyles } from '../theme';

interface TripMinimapProps {
  seatColumns: number;
  seatRows: number;
  driverSeatCount: number;
  occupiedSeats: Set<number>;
  onMovePassenger: (fromLabel: string, toLabel: string) => void;
  tempSeats: string[];
  selectedSeatLabel: string | null;
  onSeatSelect: (label: string | null) => void;
}

const MAX_TEMP_SEATS = 8;

export default function TripMinimap({
  seatColumns,
  seatRows,
  driverSeatCount,
  occupiedSeats,
  onMovePassenger,
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
        onSeatSelect(label);
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
        onSeatSelect(tempLabel);
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

  function renderGrid() {
    const gridRows: React.ReactNode[] = [];

    for (let r = 0; r < rows; r++) {
      const seats: React.ReactNode[] = [];
      for (let c = 0; c < cols; c++) {
        const seatNum = gridStart + r * cols + c;
        const occupied = occupiedSeats.has(seatNum);
        const isSelected = selectedSeatLabel === seatNum.toString();
        const isTarget = isDropTarget(seatNum);

        seats.push(
          <TouchableOpacity
            key={seatNum}
            activeOpacity={0.6}
            onPress={() => handleSeatPress(seatNum)}
            style={[
              styles.seat,
              occupied
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { backgroundColor: colors.surface, borderColor: colors.borderLight },
              isSelected && {
                backgroundColor: colors.accentLight,
                borderColor: colors.warning,
                borderWidth: 2,
              },
              isTarget && {
                backgroundColor: colors.dropTargetBg,
                borderColor: colors.dropTargetBorder,
                borderWidth: 2,
              },
            ]}
          >
            <Text
              style={[
                styles.seatText,
                occupied ? { color: colors.text.inverse } : { color: colors.text.secondary },
                isSelected && { color: colors.warningText },
              ]}
            >
              {seatNum}
            </Text>
          </TouchableOpacity>,
        );
      }
      gridRows.push(
        <View key={`grid-row-${r}`} style={styles.seatRow}>
          {seats}
        </View>,
      );
    }
    return gridRows;
  }

  function renderDriverSeats() {
    const driverSeats: React.ReactNode[] = [];
    for (let i = 1; i <= driverSeatCount; i++) {
      const seatNum = i;
      const occupied = occupiedSeats.has(seatNum);
      const isSelected = selectedSeatLabel === seatNum.toString();
      const isTarget = isDropTarget(seatNum);

      driverSeats.push(
        <TouchableOpacity
          key={seatNum}
          activeOpacity={0.6}
          onPress={() => handleSeatPress(seatNum)}
          style={[
            styles.seat,
            occupied
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.surface, borderColor: colors.borderLight },
            isSelected && {
              backgroundColor: colors.accentLight,
              borderColor: colors.warning,
              borderWidth: 2,
            },
            isTarget && {
              backgroundColor: colors.dropTargetBg,
              borderColor: colors.dropTargetBorder,
              borderWidth: 2,
            },
          ]}
        >
          <Text
            style={[
              styles.seatText,
              occupied ? { color: colors.text.inverse } : { color: colors.text.secondary },
              isSelected && { color: colors.warningText },
            ]}
          >
            {seatNum}
          </Text>
        </TouchableOpacity>,
      );
    }
    return driverSeats;
  }

  function renderTempSeats() {
    const slots: React.ReactNode[] = [];
    for (let i = 1; i <= MAX_TEMP_SEATS; i++) {
      const label = `temp-${i}`;
      const occupied = occupiedTempSet.has(label);
      const isSelected = selectedSeatLabel === label;
      const isTarget = isTempDropTarget(label);

      slots.push(
        <TouchableOpacity
          key={label}
          activeOpacity={0.6}
          onPress={() => handleTempSeatPress(label)}
          style={[
            styles.tempSeat,
            occupied
              ? {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  borderStyle: 'solid',
                }
              : { backgroundColor: colors.surface, borderColor: colors.borderLight },
            isSelected && {
              backgroundColor: colors.accentLight,
              borderColor: colors.warning,
              borderWidth: 2,
            },
            isTarget && {
              backgroundColor: colors.dropTargetBg,
              borderColor: colors.dropTargetBorder,
              borderWidth: 2,
              borderStyle: 'solid',
            },
          ]}
        >
          <Text
            style={[
              styles.tempSeatText,
              occupied && { color: colors.text.inverse },
              isSelected && { color: colors.warningText },
            ]}
          >
            T{i}
          </Text>
        </TouchableOpacity>,
      );
    }
    return slots;
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
          <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
          <Text style={styles.legendText}>Free ({freeSeatsCount})</Text>
        </View>
      </View>

      {selectedSeatLabel !== null && (
        <Text style={[styles.moveHint, { color: colors.warning }]}>
          Tap a free seat to move passenger, or tap the selected seat to cancel.
        </Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.minimap}>
          <View style={styles.driverArea}>
            <View
              style={[
                styles.seat,
                styles.seatDriver,
                { backgroundColor: colors.warningBg, borderColor: colors.warningBorder },
              ]}
            >
              <Text style={[styles.seatText, { color: colors.warningText }]}>D</Text>
            </View>
            <View style={styles.frontRow}>{renderDriverSeats()}</View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.grid}>{renderGrid()}</View>
        </View>
      </ScrollView>

      {showTempSeats && (
        <View style={[styles.tempSection, { borderTopColor: colors.border }]}>
          <Text style={styles.tempSectionTitle}>Temporary Seats (Swap)</Text>
          <View style={styles.tempRow}>{renderTempSeats()}</View>
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
    marginBottom: 8,
    fontStyle: 'italic' as const,
  },
  minimap: {
    alignItems: 'center' as const,
  },
  driverArea: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingBottom: 8,
  },
  frontRow: {
    flexDirection: 'row' as const,
    gap: 6,
  },
  divider: {
    width: '100%' as const,
    height: 1,
    marginBottom: 8,
  },
  grid: {
    alignItems: 'center' as const,
  },
  seatRow: {
    flexDirection: 'row' as const,
    gap: 6,
    marginBottom: 6,
  },
  seat: {
    width: 36,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  seatDriver: {
    width: 36,
    height: 32,
  },
  seatText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  tempSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tempSectionTitle: {
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
  tempSeat: {
    width: 36,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  tempSeatText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.text.disabled,
  },
});
