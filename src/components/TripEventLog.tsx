import { View, Text, FlatList } from 'react-native';
import { TripEvent, TripEventType } from '../types/trip';
import { useTheme, useThemeStyles } from '../theme';

interface TripEventLogProps {
  events: TripEvent[];
}

const eventIcons: Record<TripEventType, string> = {
  TRIP_START: '\u25B6',
  TRIP_END: '\u25A0',
  PASSENGER_BOARD: '\u2795',
  PASSENGER_ALIGHT: '\u2796',
  PASSENGER_CHANGE_SEAT: '\u21C4',
  CASH_IN: '\u2193',
  CASH_OUT: '\u2191',
};

const eventLabels: Record<TripEventType, string> = {
  TRIP_START: 'Trip Started',
  TRIP_END: 'Trip Ended',
  PASSENGER_BOARD: 'Passenger Boarded',
  PASSENGER_ALIGHT: 'Passenger Alighted',
  PASSENGER_CHANGE_SEAT: 'Passenger Changed Seat',
  CASH_IN: 'Cash Received',
  CASH_OUT: 'Cash Returned',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatEventDetail(event: TripEvent): string {
  if (event.type === 'TRIP_START' || event.type === 'TRIP_END') {
    return event.label;
  }
  try {
    const parsed = JSON.parse(event.data);
    if (event.type === 'CASH_IN') {
      return `${event.label}: +${parsed.amount.toLocaleString()} Ar`;
    }
    if (event.type === 'CASH_OUT') {
      return `${event.label}: -${parsed.amount.toLocaleString()} Ar`;
    }
    if (event.type === 'PASSENGER_CHANGE_SEAT') {
      return `${event.label} \u2192 ${parsed.newLabel}`;
    }
    return event.label;
  } catch {
    return event.label;
  }
}

export default function TripEventLog({ events }: TripEventLogProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No events yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Event Log</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.eventRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.border }]}>
              <Text style={styles.icon}>{eventIcons[item.type]}</Text>
            </View>
            <View style={styles.eventContent}>
              <Text style={styles.eventType}>{eventLabels[item.type]}</Text>
              <Text style={styles.eventDetail}>{formatEventDetail(item)}</Text>
            </View>
            <Text style={styles.eventTime}>{formatTime(item.createdAt)}</Text>
          </View>
        )}
        scrollEnabled={false}
      />
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
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center' as const,
    paddingVertical: 20,
  },
  emptyText: {
    color: colors.text.disabled,
    fontSize: 14,
  },
  eventRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  icon: {
    fontSize: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.primary,
    marginBottom: 2,
  },
  eventDetail: {
    fontSize: 13,
    color: colors.text.muted,
  },
  eventTime: {
    fontSize: 12,
    color: colors.text.disabled,
    marginLeft: 8,
    marginTop: 2,
  },
});
