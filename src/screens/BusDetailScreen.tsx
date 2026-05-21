import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
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
import { useTheme, useThemeStyles } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

export default function BusDetailScreen() {
  const route = useRoute<RouteProp<BusStackParamList, 'BusDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<BusStackParamList>>();
  const { busId } = route.params;

  const [bus, setBus] = useState<Bus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { colors, fonts } = useTheme();
  const styles = useThemeStyles(createStyles);

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
        <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={styles.detailLabel}>Seat Grid</Text>
          <Text style={styles.detailValue}>
            {bus.seatColumns} × {bus.seatRows} + {bus.driverSeatCount}
          </Text>
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
  errorText: {
    fontSize: 16,
    color: colors.text.muted,
  },
  gallery: {
    height: 260,
  },
  galleryImage: {
    width: screenWidth,
    height: 260,
    resizeMode: 'cover' as const,
  },
  noPhoto: {
    height: 200,
    backgroundColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  noPhotoText: {
    fontSize: 16,
    color: colors.text.disabled,
  },
  info: {
    padding: 20,
  },
  numero: {
    fontSize: 28,
    fontWeight: '800' as const,
    fontFamily: fonts.extrabold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    color: colors.text.muted,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.text.muted,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  deletedText: {
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 28,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center' as const,
  },
  editBtn: {
    backgroundColor: colors.primary,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.inverse,
  },
  deleteBtn: {
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.danger,
  },
  restoreBtn: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  restoreBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.success,
  },
});
