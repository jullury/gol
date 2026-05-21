import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Trip } from '../types/trip';

interface TripCardProps {
  trip: Trip;
  busNumero?: string;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function TripCard({ trip, busNumero, onPress, onLongPress }: TripCardProps) {
  const isActive = trip.endDateTime === null;

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.busLabel}>{busNumero ?? 'Unknown Bus'}</Text>
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        )}
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Start</Text>
        <Text style={styles.value}>{formatDate(trip.startDateTime)}</Text>
      </View>
      {trip.endDateTime && (
        <View style={styles.row}>
          <Text style={styles.label}>End</Text>
          <Text style={styles.value}>{formatDate(trip.endDateTime)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  busLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  activeBadgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  value: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});
