import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bus } from '../types/bus';
import { getBusById, softDeleteBus, restoreBus } from '../db/bus-repository';
import type { BusStackParamList } from '../navigation/BusStackNavigator';

const { width: screenWidth } = Dimensions.get('window');

export default function BusDetailScreen() {
  const route = useRoute<RouteProp<BusStackParamList, 'BusDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<BusStackParamList>>();
  const { busId } = route.params;

  const [bus, setBus] = useState<Bus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadBus();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busId]),
  );

  async function loadBus() {
    setIsLoading(true);
    try {
      const data = await getBusById(busId);
      setBus(data);
    } catch {
      Alert.alert('Error', 'Failed to load bus.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete() {
    if (!bus) return;
    Alert.alert('Delete Bus', `Delete ${bus.numero}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await softDeleteBus(bus.id);
          navigation.goBack();
        },
      },
    ]);
  }

  async function handleRestore() {
    if (!bus) return;
    await restoreBus(bus.id);
    loadBus();
  }

  function formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const photos = [bus?.photo1, bus?.photo2, bus?.photo3].filter((p): p is string => p !== null);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!bus) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Bus not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {photos.length > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator style={styles.gallery}>
          {photos.map((uri, index) => (
            <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => Linking.openURL(uri)}>
              <Image source={{ uri }} style={styles.galleryImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noPhoto}>
          <Text style={styles.noPhotoText}>No Photos</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.numero}>{bus.numero}</Text>
        <Text style={styles.name}>{bus.name}</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Number of Places</Text>
          <Text style={styles.detailValue}>{bus.numberOfPlace}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created</Text>
          <Text style={styles.detailValue}>{formatDate(bus.createdAt)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Updated</Text>
          <Text style={styles.detailValue}>{formatDate(bus.updatedAt)}</Text>
        </View>

        {bus.deletedAt && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Deleted</Text>
            <Text style={[styles.detailValue, styles.deletedText]}>
              {formatDate(bus.deletedAt)}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.editBtn]}
            onPress={() => navigation.navigate('BusForm', { busId: bus.id })}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          {bus.deletedAt ? (
            <TouchableOpacity style={[styles.btn, styles.restoreBtn]} onPress={handleRestore}>
              <Text style={styles.restoreBtnText}>Restore</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  gallery: {
    height: 260,
  },
  galleryImage: {
    width: screenWidth,
    height: 260,
    resizeMode: 'cover',
  },
  noPhoto: {
    height: 200,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  info: {
    padding: 20,
  },
  numero: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    color: '#4b5563',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  deletedText: {
    color: '#dc2626',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#2563eb',
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  restoreBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  restoreBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
});
