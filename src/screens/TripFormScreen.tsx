import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllBuses } from '../db/bus-repository';
import { getAllRoutes } from '../db/route-repository';
import { getSetting } from '../db/settings-repository';
import { createTrip, hasActiveTrip } from '../db/trip-repository';
import { Bus } from '../types/bus';
import { Route } from '../types/route';
import type { TripStackParamList } from '../navigation/TripStackNavigator';
import { useTheme, useThemeStyles } from '../theme';

export default function TripFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripStackParamList>>();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showBusPicker, setShowBusPicker] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [busData, routeData] = await Promise.all([getAllBuses('active'), getAllRoutes()]);
      setBuses(busData);
      setRoutes(routeData);

      const [defaultBusId, defaultRouteId] = await Promise.all([
        getSetting('default_bus_id'),
        getSetting('default_route_id'),
      ]);

      if (defaultBusId && busData.some((b) => b.id === defaultBusId)) {
        setSelectedBusId(defaultBusId);
      }
      if (defaultRouteId && routeData.some((r) => r.id === defaultRouteId)) {
        setSelectedRouteId(defaultRouteId);
      }
    } catch {
      Alert.alert('Error', 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartTrip() {
    if (!selectedBusId) return;

    setIsSaving(true);
    try {
      const active = await hasActiveTrip(selectedBusId);
      if (active) {
        Alert.alert('Active Trip', 'This bus already has an active trip. End it first.');
        setIsSaving(false);
        return;
      }

      await createTrip({
        busId: selectedBusId,
        routeId: selectedRouteId,
        startDateTime: Date.now(),
      });

      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to start trip.');
    } finally {
      setIsSaving(false);
    }
  }

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const selectedBus = buses.find((b) => b.id === selectedBusId);
  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (buses.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No buses available. Create a bus first.</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Select Bus</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setShowBusPicker(true)}>
        <Text style={[styles.selectorText, !selectedBus && styles.selectorPlaceholder]}>
          {selectedBus ? `${selectedBus.numero} - ${selectedBus.name}` : 'Select a bus'}
        </Text>
        <Text style={styles.selectorArrow}>▼</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Select Route</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setShowRoutePicker(true)}>
        <Text style={[styles.selectorText, !selectedRoute && styles.selectorPlaceholder]}>
          {selectedRoute ? selectedRoute.name : 'Select a route'}
        </Text>
        <Text style={styles.selectorArrow}>▼</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.startBtn, (!selectedBusId || isSaving) && styles.btnDisabled]}
          onPress={handleStartTrip}
          disabled={!selectedBusId || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.text.inverse} size="small" />
          ) : (
            <Text style={styles.startBtnText}>Start Trip</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showBusPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Bus</Text>
            <FlatList
              data={buses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedBusId === item.id && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedBusId(item.id);
                    setShowBusPicker(false);
                  }}
                >
                  <Text style={styles.modalOptionNumero}>{item.numero}</Text>
                  <Text style={styles.modalOptionName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowBusPicker(false)}>
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showRoutePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Route</Text>
            {routes.length === 0 ? (
              <Text style={styles.modalEmptyText}>No routes available. Create a route first.</Text>
            ) : (
              <FlatList
                data={routes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      selectedRouteId === item.id && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedRouteId(item.id);
                      setShowRoutePicker(false);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowRoutePicker(false)}
            >
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 20,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.muted,
    textAlign: 'center' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    marginBottom: 12,
  },
  selector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text.primary,
  },
  selectorPlaceholder: {
    color: colors.text.disabled,
    fontWeight: '400' as const,
  },
  selectorArrow: {
    fontSize: 12,
    color: colors.text.muted,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 12,
    marginBottom: 40,
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cancelBtn: {
    backgroundColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.secondary,
  },
  startBtn: {
    backgroundColor: colors.primary,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.inverse,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%' as const,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: colors.border,
  },
  modalOptionNumero: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  modalOptionName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.text.primary,
  },
  modalEmptyText: {
    fontSize: 14,
    color: colors.text.disabled,
    textAlign: 'center' as const,
    paddingVertical: 20,
  },
  modalCloseBtn: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center' as const,
    marginTop: 12,
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.secondary,
  },
});
