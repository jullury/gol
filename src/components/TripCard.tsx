import { View, Text, TouchableOpacity } from 'react-native';
import { Trip } from '../types/trip';
import { useTheme, useThemeStyles } from '../theme';

interface TripCardProps {
  trip: Trip;
  busNumero?: string;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function TripCard({ trip, busNumero, onPress, onLongPress }: TripCardProps) {
  const isActive = trip.endDateTime === null;
  const styles = useThemeStyles(createStyles);

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

const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  busLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text.primary,
  },
  activeBadge: {
    backgroundColor: colors.successBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  activeBadgeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: colors.text.muted,
  },
  value: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500' as const,
  },
});
