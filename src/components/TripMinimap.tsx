import { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TripEvent, TripEventType } from '../types/trip';

interface TripMinimapProps {
  events: TripEvent[];
  scrollEnabled: boolean;
}

const eventColors: Record<TripEventType, string> = {
  TRIP_START: '#16a34a',
  TRIP_END: '#dc2626',
  PASSENGER_BOARD: '#2563eb',
  PASSENGER_ALIGHT: '#ea580c',
  CASH_IN: '#16a34a',
  CASH_OUT: '#dc2626',
};

const eventIcons: Record<TripEventType, string> = {
  TRIP_START: '\u25B6',
  TRIP_END: '\u25A0',
  PASSENGER_BOARD: '\u2795',
  PASSENGER_ALIGHT: '\u2796',
  CASH_IN: '\u2193',
  CASH_OUT: '\u2191',
};

const eventLabels: Record<TripEventType, string> = {
  TRIP_START: 'Start',
  TRIP_END: 'End',
  PASSENGER_BOARD: 'Board',
  PASSENGER_ALIGHT: 'Alight',
  CASH_IN: 'In',
  CASH_OUT: 'Out',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TripMinimap({ events, scrollEnabled }: TripMinimapProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!scrollEnabled && scrollRef.current && events.length > 0) {
      scrollRef.current.scrollToEnd({ animated: false });
    }
  }, [events, scrollEnabled]);

  if (events.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timeline</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={styles.scrollContent}
      >
        {events.map((event, index) => {
          const color = eventColors[event.type];
          const isLast = index === events.length - 1;

          return (
            <View key={event.id} style={styles.eventGroup}>
              <View style={styles.dotContainer}>
                <View style={[styles.dot, { backgroundColor: color }]}>
                  <Text style={styles.dotIcon}>{eventIcons[event.type]}</Text>
                </View>
                {!isLast && <View style={styles.line} />}
              </View>
              <View style={styles.labelContainer}>
                <Text style={[styles.eventType, { color }]} numberOfLines={1}>
                  {eventLabels[event.type]}
                </Text>
                <Text style={styles.eventTime} numberOfLines={1}>
                  {formatTime(event.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}
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
    marginBottom: 12,
  },
  scrollContent: {
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  eventGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotIcon: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  line: {
    width: 20,
    height: 2,
    backgroundColor: '#d1d5db',
  },
  labelContainer: {
    marginLeft: 4,
    marginRight: 8,
    minWidth: 40,
  },
  eventType: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 1,
  },
});
