import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createStop, updateStop, getStopsForRoute } from '../db/route-repository';
import type { RouteStackParamList } from '../navigation/RouteStackNavigator';
import { useTheme, useThemeStyles } from '../theme';

export default function StopFormScreen() {
  const route = useRoute<RouteProp<RouteStackParamList, 'StopForm'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RouteStackParamList>>();
  const { routeId, stopId } = route.params ?? {};

  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(!!stopId);
  const [isSaving, setIsSaving] = useState(false);
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  useEffect(() => {
    if (stopId) {
      loadStop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopId]);

  async function loadStop() {
    if (!routeId || !stopId) return;
    try {
      const stops = await getStopsForRoute(routeId);
      const stop = stops.find((s) => s.id === stopId);
      if (stop) {
        setName(stop.name);
        setLatitude(stop.latitude?.toString() ?? '');
        setLongitude(stop.longitude?.toString() ?? '');
      } else {
        Alert.alert('Error', 'Stop not found.');
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Failed to load stop.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!routeId) return;

    setIsSaving(true);
    try {
      const rawLat = latitude.trim();
      const rawLng = longitude.trim();
      const lat = rawLat ? (isNaN(parseFloat(rawLat)) ? null : parseFloat(rawLat)) : null;
      const lng = rawLng ? (isNaN(parseFloat(rawLng)) ? null : parseFloat(rawLng)) : null;

      if (stopId) {
        await updateStop(stopId, {
          name: trimmed,
          latitude: lat,
          longitude: lng,
        });
      } else {
        await createStop(routeId, {
          name: trimmed,
          latitude: lat,
          longitude: lng,
        });
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save stop.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isValid = name.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Stop Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Central Station"
          placeholderTextColor={colors.text.disabled}
          autoFocus={!stopId}
        />

        <Text style={styles.label}>Latitude</Text>
        <TextInput
          style={styles.input}
          value={latitude}
          onChangeText={setLatitude}
          placeholder="e.g. -18.8792"
          placeholderTextColor={colors.text.disabled}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Longitude</Text>
        <TextInput
          style={styles.input}
          value={longitude}
          onChangeText={setLongitude}
          placeholder="e.g. 47.5079"
          placeholderTextColor={colors.text.disabled}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity
          style={[styles.saveBtn, (!isValid || isSaving) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!isValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.text.inverse} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{stopId ? 'Update Stop' : 'Add Stop'}</Text>
          )}
        </TouchableOpacity>
      </View>
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
  form: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    margin: 16,
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
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text.primary,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center' as const,
    marginTop: 20,
  },
  saveBtnText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
