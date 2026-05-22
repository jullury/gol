import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Route } from '../types/route';
import { getAllRoutes } from '../db/route-repository';
import { getSetting } from '../db/settings-repository';
import type { RouteStackParamList } from '../navigation/RouteStackNavigator';
import { useTheme, useThemeStyles } from '../theme';

export default function RouteListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RouteStackParamList>>();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [defaultRouteId, setDefaultRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  useFocusEffect(
    useCallback(() => {
      loadRoutes();
    }, []),
  );

  async function loadRoutes() {
    setIsLoading(true);
    try {
      const data = await getAllRoutes();
      setRoutes(data);
      const defaultId = await getSetting('default_route_id');
      setDefaultRouteId(defaultId);
    } catch {
      Alert.alert('Error', 'Failed to load routes.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No routes yet. Tap + to create one.</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.routeCard}
              onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.routeInfo}>
                <Text style={styles.routeName}>{item.name}</Text>
              </View>
              {item.id === defaultRouteId && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          refreshing={isLoading}
          onRefresh={loadRoutes}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RouteDetail', undefined)}
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
  routeCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  defaultBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  defaultBadgeText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '700' as const,
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
