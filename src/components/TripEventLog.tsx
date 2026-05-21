import { View, Text, FlatList, StyleSheet } from 'react-native';
import { TripEvent, TripEventType } from '../types/trip';

interface TripEventLogProps {
  events: TripEvent[];
}

const eventIcons: Record<TripEventType, string> = {
  TRIP_START: '\u25B6',
  TRIP_END: '\u25A0',
  PASSENGER_BOARD: '\u2795',
  PASSENGER_ALIGHT: '\u2796',
  CASH_IN: '\u2193',
  CASH_OUT: '\u2191',
};

const eventLabels: Record<TripEventType, string> = {
  TRIP_START: 'Trip Started',
  TRIP_END: 'Trip Ended',
  PASSENGER_BOARD: 'Passenger Boarded',
  PASSENGER_ALIGHT: 'Passenger Alighted',
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
    return event.label;
  } catch {
    return event.label;
  }
}

export default function TripEventLog({ events }: TripEventLogProps) {
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
            <View style={styles.iconContainer}>
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
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  eventDetail: {
    fontSize: 13,
    color: '#6b7280',
  },
  eventTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
    marginTop: 2,
  },
});
