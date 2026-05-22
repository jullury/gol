import { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { RouteStop } from '../types/route';
import {
  getRouteWithStops,
  createRoute,
  updateRoute,
  softDeleteRoute,
  reorderStops,
  deleteStop,
} from '../db/route-repository';
import { setSetting } from '../db/settings-repository';
import type { RouteStackParamList } from '../navigation/RouteStackNavigator';
import { useTheme, useThemeStyles } from '../theme';

export default function RouteDetailScreen() {
  const routeParam = useRoute<RouteProp<RouteStackParamList, 'RouteDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RouteStackParamList>>();
  const routeId = routeParam.params?.routeId;

  const [name, setName] = useState('');
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isCreate = !routeId;
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isMountedRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      if (routeId) {
        loadRoute();
      } else {
        setName('');
        setStops([]);
        setIsLoading(false);
      }
      return () => {
        isMountedRef.current = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeId]),
  );

  async function loadRoute() {
    if (!routeId) return;
    setIsLoading(true);
    try {
      const data = await getRouteWithStops(routeId);
      if (data && isMountedRef.current) {
        setName(data.name);
        setStops(data.stops);
      } else if (data) {
        Alert.alert('Error', 'Route not found.');
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Failed to load route.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      if (isCreate) {
        const created = await createRoute({ name: trimmed });
        navigation.navigate('RouteDetail', { routeId: created.id });
      } else if (routeId) {
        await updateRoute(routeId, { name: trimmed });
      }
    } catch {
      Alert.alert('Error', 'Failed to save route.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetDefault() {
    if (!routeId) return;
    try {
      await setSetting('default_route_id', routeId);
      Alert.alert('Done', 'Set as default route.');
    } catch {
      Alert.alert('Error', 'Failed to set default route.');
    }
  }

  function handleDelete() {
    if (!routeId) return;
    Alert.alert('Delete Route', 'Are you sure you want to delete this route?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await softDeleteRoute(routeId);
          navigation.goBack();
        },
      },
    ]);
  }

  function handleAddStop() {
    if (!routeId) {
      Alert.alert('Save First', 'Please save the route before adding stops.');
      return;
    }
    navigation.navigate('StopForm', { routeId });
  }

  function handleEditStop(stopId: string) {
    if (!routeId) return;
    navigation.navigate('StopForm', { routeId, stopId });
  }

  async function handleDeleteStop(stopId: string) {
    Alert.alert('Delete Stop', 'Remove this stop from the route?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteStop(stopId);
          loadRoute();
        },
      },
    ]);
  }

  async function handleDragEnd({ data }: { data: RouteStop[] }) {
    setStops(data);
    if (routeId) {
      await reorderStops(
        routeId,
        data.map((s) => s.id),
      );
    }
  }

  const renderStopItem = useCallback(
    ({ item, drag, isActive }: { item: RouteStop; drag: () => void; isActive: boolean }) => {
      return (
        <ScaleDecorator>
          <TouchableOpacity
            style={[styles.stopRow, isActive && styles.stopRowActive]}
            onPress={() => handleEditStop(item.id)}
            onLongPress={drag}
            activeOpacity={0.7}
          >
            <TouchableOpacity onLongPress={drag} style={styles.dragHandle}>
              <Ionicons name="reorder-two" size={22} color={colors.text.muted} />
            </TouchableOpacity>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{item.orderNumber}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopName}>{item.name}</Text>
              {item.latitude != null && item.longitude != null && (
                <Text style={styles.stopCoords}>
                  {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteStop(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={22} color={colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.nameSection}>
        <Text style={styles.label}>Route Name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Downtown Loop"
          placeholderTextColor={colors.text.disabled}
          autoFocus={isCreate}
        />
        <TouchableOpacity
          style={[styles.saveBtn, (!name.trim() || isSaving) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.text.inverse} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{isCreate ? 'Create Route' : 'Save'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.stopsSection}>
        <Text style={styles.sectionTitle}>Stops ({stops.length})</Text>

        {stops.length > 0 ? (
          <GestureHandlerRootView style={styles.dragContainer}>
            <DraggableFlatList
              data={stops}
              keyExtractor={(item) => item.id}
              renderItem={renderStopItem}
              onDragEnd={handleDragEnd}
            />
          </GestureHandlerRootView>
        ) : (
          <Text style={styles.noStops}>No stops yet.</Text>
        )}

        <TouchableOpacity style={styles.addStopBtn} onPress={handleAddStop}>
          <Ionicons name="add" size={20} color={colors.text.inverse} />
          <Text style={styles.addStopBtnText}>Add Stop</Text>
        </TouchableOpacity>
      </View>

      {!isCreate && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.defaultBtn} onPress={handleSetDefault}>
            <Text style={styles.defaultBtnText}>Set as Default</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Delete Route</Text>
          </TouchableOpacity>
        </View>
      )}
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
  nameSection: {
    backgroundColor: colors.surface,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text.primary,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  saveBtnText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  stopsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  dragContainer: {
    flex: 1,
  },
  stopRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stopRowActive: {
    backgroundColor: colors.surfaceAlt,
    shadowOpacity: 0.2,
    elevation: 5,
  },
  dragHandle: {
    padding: 4,
    marginRight: 8,
  },
  orderBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  orderBadgeText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  stopCoords: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  noStops: {
    fontSize: 14,
    color: colors.text.disabled,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  addStopBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
    gap: 6,
  },
  addStopBtnText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  defaultBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  defaultBtnText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: colors.dangerBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingVertical: 14,
    alignItems: 'center' as const,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
