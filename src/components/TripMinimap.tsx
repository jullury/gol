import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface TripMinimapProps {
  seatColumns: number;
  seatRows: number;
  driverSeatCount: number;
  occupiedSeats: Set<number>;
}

export default function TripMinimap({
  seatColumns,
  seatRows,
  driverSeatCount,
  occupiedSeats,
}: TripMinimapProps) {
  const cols = seatColumns > 0 ? seatColumns : 5;
  const rows = seatRows > 0 ? seatRows : 4;
  const gridStart = 1 + driverSeatCount;

  function renderGrid() {
    const gridRows: React.ReactNode[] = [];

    for (let r = 0; r < rows; r++) {
      const seats: React.ReactNode[] = [];
      for (let c = 0; c < cols; c++) {
        const seatNum = gridStart + r * cols + c;
        const occupied = occupiedSeats.has(seatNum);
        seats.push(
          <View
            key={seatNum}
            style={[styles.seat, occupied ? styles.seatOccupied : styles.seatEmpty]}
          >
            <Text
              style={[styles.seatText, occupied ? styles.seatTextOccupied : styles.seatTextEmpty]}
            >
              {seatNum}
            </Text>
          </View>,
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

  const totalSeats = cols * rows + driverSeatCount;
  const occupiedCount = occupiedSeats.size;
  const freeCount = totalSeats - occupiedCount;

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
          <Text style={styles.legendText}>Free ({freeCount})</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.minimap}>
          <View style={styles.driverArea}>
            <View style={[styles.seat, styles.seatDriver]}>
              <Text style={styles.seatDriverText}>D</Text>
            </View>
            <View style={styles.frontRow}>
              {Array.from({ length: driverSeatCount }, (_, i) => {
                const seatNum = i + 1;
                return (
                  <View
                    key={seatNum}
                    style={[
                      styles.seat,
                      occupiedSeats.has(seatNum) ? styles.seatOccupied : styles.seatEmpty,
                    ]}
                  >
                    <Text
                      style={[
                        styles.seatText,
                        occupiedSeats.has(seatNum) ? styles.seatTextOccupied : styles.seatTextEmpty,
                      ]}
                    >
                      {seatNum}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.grid}>{renderGrid()}</View>
        </View>
      </ScrollView>
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
  seatDriver: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    width: 36,
    height: 32,
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
  seatDriverText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
});
