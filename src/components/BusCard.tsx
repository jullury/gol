import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Bus } from '../types/bus';
import DeleteBadge from './DeleteBadge';
import { useTheme, useThemeStyles } from '../theme';

interface BusCardProps {
  bus: Bus;
  onPress: () => void;
  onLongPress: () => void;
}

export default function BusCard({ bus, onPress, onLongPress }: BusCardProps) {
  const thumbnailSource = bus.photo1 ? { uri: bus.photo1 } : null;
  const styles = useThemeStyles(createStyles);

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

const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
  card: {
    flexDirection: 'row' as const,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative' as const,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderThumb: {
    backgroundColor: colors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  placeholderText: {
    color: colors.text.disabled,
    fontSize: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  numero: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text.primary,
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  seats: {
    fontSize: 13,
    color: colors.text.muted,
  },
});
