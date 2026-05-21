import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Bus } from '../types/bus';
import DeleteBadge from './DeleteBadge';

interface BusCardProps {
  bus: Bus;
  onPress: () => void;
  onLongPress: () => void;
}

export default function BusCard({ bus, onPress, onLongPress }: BusCardProps) {
  const thumbnailSource = bus.photo1 ? { uri: bus.photo1 } : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {bus.deletedAt !== null && <DeleteBadge />}

      {thumbnailSource ? (
        <Image source={thumbnailSource} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.placeholderThumb]}>
          <Text style={styles.placeholderText}>No Photo</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.numero}>{bus.numero}</Text>
        <Text style={styles.name}>{bus.name}</Text>
        <Text style={styles.seats}>{bus.numberOfPlace} seats</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderThumb: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  numero: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 2,
  },
  seats: {
    fontSize: 13,
    color: '#6b7280',
  },
});
