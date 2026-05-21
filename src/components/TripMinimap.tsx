import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

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
              occupied ? styles.seatOccupied : styles.seatEmpty,
              isSelected && styles.seatSelected,
              isTarget && styles.seatDropTarget,
            ]}
          >
            <Text
              style={[
                styles.seatText,
                occupied ? styles.seatTextOccupied : styles.seatTextEmpty,
                isSelected && styles.seatTextSelected,
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
            occupied && styles.tempSeatOccupied,
            isSelected && styles.seatSelected,
            isTarget && styles.tempSeatDropTarget,
          ]}
        >
          <Text
            style={[
              styles.tempSeatText,
              occupied && styles.tempSeatTextOccupied,
              isSelected && styles.seatTextSelected,
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
          <View style={[styles.legendDot, styles.legendOccupied]} />
          <Text style={styles.legendText}>Occupied ({occupiedCount})</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendFree]} />
          <Text style={styles.legendText}>Free ({freeSeatsCount})</Text>
        </View>
      </View>

      {selectedSeatLabel !== null && (
        <Text style={styles.moveHint}>
          Tap a free seat to move passenger, or tap the selected seat to cancel.
        </Text>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.minimap}>
          <View style={styles.driverArea}>
            <View style={[styles.seat, styles.seatDriver]}>
              <Text style={styles.seatDriverText}>D</Text>
            </View>
            <View style={styles.frontRow}>
              {Array.from({ length: driverSeatCount }, (_, i) => {
                const seatNum = i + 1;
                const occupied = occupiedSeats.has(seatNum);
                const isSelected = selectedSeatLabel === seatNum.toString();
                const isTarget = isDropTarget(seatNum);

                return (
                  <TouchableOpacity
                    key={seatNum}
                    activeOpacity={0.6}
                    onPress={() => handleSeatPress(seatNum)}
                    style={[
                      styles.seat,
                      occupied ? styles.seatOccupied : styles.seatEmpty,
                      isSelected && styles.seatSelected,
                      isTarget && styles.seatDropTarget,
                    ]}
                  >
                    <Text
                      style={[
                        styles.seatText,
                        occupied ? styles.seatTextOccupied : styles.seatTextEmpty,
                        isSelected && styles.seatTextSelected,
                      ]}
                    >
                      {seatNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.grid}>{renderGrid()}</View>
        </View>
      </ScrollView>

      {showTempSeats && (
        <View style={styles.tempSection}>
          <Text style={styles.tempSectionTitle}>Temporary Seats (Swap)</Text>
          <View style={styles.tempRow}>{renderTempSeats()}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendOccupied: {
    backgroundColor: '#2563eb',
  },
  legendFree: {
    backgroundColor: '#e5e7eb',
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  moveHint: {
    fontSize: 12,
    color: '#d97706',
    fontWeight: '600',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  minimap: {
    alignItems: 'center',
  },
  driverArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  frontRow: {
    flexDirection: 'row',
    gap: 6,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 8,
  },
  grid: {
    alignItems: 'center',
  },
  seatRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  seat: {
    width: 36,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatEmpty: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  seatOccupied: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  seatSelected: {
    backgroundColor: '#fbbf24',
    borderColor: '#d97706',
    borderWidth: 2,
  },
  seatDropTarget: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 2,
  },
  seatText: {
    fontSize: 11,
    fontWeight: '600',
  },
  seatTextEmpty: {
    color: '#374151',
  },
  seatTextOccupied: {
    color: '#ffffff',
  },
  seatTextSelected: {
    color: '#92400e',
  },
  seatDriver: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    width: 36,
    height: 32,
  },
  seatDriverText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  tempSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  tempSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  tempRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tempSeat: {
    width: 36,
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  tempSeatOccupied: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
    borderStyle: 'solid',
  },
  tempSeatDropTarget: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
    borderWidth: 2,
    borderStyle: 'solid',
  },
  tempSeatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tempSeatTextOccupied: {
    color: '#ffffff',
  },
});
