import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BusCard from '../components/BusCard';
import { Bus } from '../types/bus';
import { getAllBuses, softDeleteBus } from '../db/bus-repository';
import type { BusStackParamList } from '../navigation/BusStackNavigator';
import { useTheme, useThemeStyles } from '../theme';

type FilterMode = 'active' | 'deleted';

export default function BusListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BusStackParamList>>();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>('active');
  const { colors, fonts } = useTheme();
  const styles = useThemeStyles(createStyles);

  useFocusEffect(
    useCallback(() => {
      loadBuses();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]),
  );

  async function loadBuses() {
    setIsLoading(true);
    try {
      const data = await getAllBuses(filter);
      setBuses(data);
    } catch {
      Alert.alert('Error', 'Failed to load buses.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete(bus: Bus) {
    Alert.alert('Delete Bus', `Are you sure you want to delete ${bus.numero}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await softDeleteBus(bus.id);
          loadBuses();
        },
      },
    ]);
  }

  const activeCount = buses.filter((b) => b.deletedAt === null).length;

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'active' && styles.filterBtnActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterBtnText, filter === 'active' && styles.filterBtnTextActive]}>
            Active ({activeCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'deleted' && styles.filterBtnActive]}
          onPress={() => setFilter('deleted')}
        >
          <Text style={[styles.filterBtnText, filter === 'deleted' && styles.filterBtnTextActive]}>
            Deleted
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : buses.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {filter === 'active' ? 'No buses yet. Tap + to add one.' : 'No deleted buses.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={buses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BusCard
              bus={item}
              onPress={() => navigation.navigate('BusDetail', { busId: item.id })}
              onLongPress={() => handleDelete(item)}
            />
          )}
          refreshing={isLoading}
          onRefresh={loadBuses}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('BusForm', undefined)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: 'row' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterBtnText: {
    fontSize: 14,
    color: colors.text.muted,
    fontWeight: '500' as const,
  },
  filterBtnTextActive: {
    color: colors.text.inverse,
  },
  center: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.disabled,
    textAlign: 'center' as const,
    paddingHorizontal: 32,
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute' as const,
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: colors.text.inverse,
    lineHeight: 30,
  },
});
