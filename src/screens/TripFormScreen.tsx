import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getAllBuses } from '../db/bus-repository';
import { createTrip, hasActiveTrip } from '../db/trip-repository';
import { Bus } from '../types/bus';
import type { TripStackParamList } from '../navigation/TripStackNavigator';
import { useTheme, useThemeStyles } from '../theme';

export default function TripFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripStackParamList>>();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { colors, fonts } = useTheme();
  const styles = useThemeStyles(createStyles);

  useEffect(() => {
    loadBuses();
  }, []);

  async function loadBuses() {
    setIsLoading(true);
    try {
      const data = await getAllBuses('active');
      setBuses(data);
    } catch {
      Alert.alert('Error', 'Failed to load buses.');
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
      {buses.map((bus) => (
        <TouchableOpacity
          key={bus.id}
          style={[styles.busOption, selectedBusId === bus.id && styles.busOptionSelected]}
          onPress={() => setSelectedBusId(bus.id)}
        >
          <View style={styles.radioOuter}>
            {selectedBusId === bus.id && <View style={styles.radioInner} />}
          </View>
          <View style={styles.busInfo}>
            <Text style={styles.busNumero}>{bus.numero}</Text>
            <Text style={styles.busName}>{bus.name}</Text>
            <Text style={styles.busSeats}>{bus.numberOfPlace} seats</Text>
          </View>
        </TouchableOpacity>
      ))}

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
  busOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  busOptionSelected: {
    borderColor: colors.primary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderLight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  busInfo: {
    flex: 1,
  },
  busNumero: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: fonts.bold,
    color: colors.text.primary,
  },
  busName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  busSeats: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 24,
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
});
