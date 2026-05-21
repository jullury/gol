import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TripCard from '../components/TripCard';
import { Trip } from '../types/trip';
import { getAllTrips } from '../db/trip-repository';
import { getBusById } from '../db/bus-repository';
import type { TripStackParamList } from '../navigation/TripStackNavigator';
import type { Bus } from '../types/bus';

type FilterMode = 'active' | 'completed';

export default function TripListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripStackParamList>>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [busCache, setBusCache] = useState<Record<string, Bus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('active');

  useFocusEffect(
    useCallback(() => {
      loadTrips();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]),
  );

  async function loadTrips() {
    setIsLoading(true);
    try {
      const data = await getAllTrips(filter);
      setTrips(data);

      const cache: Record<string, Bus> = {};
      for (const trip of data) {
        if (!busCache[trip.busId] && !cache[trip.busId]) {
          const bus = await getBusById(trip.busId);
          if (bus) {
            cache[trip.busId] = bus;
          }
        }
      }
      setBusCache((prev) => ({ ...prev, ...cache }));
    } catch {
      Alert.alert('Error', 'Failed to load trips.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'active' && styles.filterBtnActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterBtnText, filter === 'active' && styles.filterBtnTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'completed' && styles.filterBtnActive]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[styles.filterBtnText, filter === 'completed' && styles.filterBtnTextActive]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {filter === 'active'
              ? 'No active trips. Tap + to start one.'
              : 'No completed trips.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              busNumero={busCache[item.busId]?.numero}
              onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
            />
          )}
          refreshing={isLoading}
          onRefresh={loadTrips}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TripForm', undefined)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  filterBtnActive: {
    backgroundColor: '#2563eb',
  },
  filterBtnText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#ffffff',
    lineHeight: 30,
  },
});
