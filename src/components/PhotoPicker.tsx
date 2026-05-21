import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MAX_PHOTOS } from '../constants/bus';
import { useTheme, useThemeStyles } from '../theme';

interface PhotoPickerProps {
  photos: (string | null)[];
  onPhotosChange: (photos: (string | null)[]) => void;
}

export default function PhotoPicker({ photos, onPhotosChange }: PhotoPickerProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  const filledPhotos = photos.filter((p): p is string => p !== null);
  const canAddMore = filledPhotos.length < MAX_PHOTOS;

  async function pickImage(index: number) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to your photo library to add bus photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      onPhotosChange(newPhotos);
    }
  }

  async function takePhoto(index: number) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow access to your camera to take bus photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      onPhotosChange(newPhotos);
    }
  }

  function removePhoto(index: number) {
    const newPhotos = [...photos];
    newPhotos[index] = null;
    onPhotosChange(newPhotos);
  }

  function showPicker(index: number) {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Gallery', onPress: () => pickImage(index) },
      { text: 'Camera', onPress: () => takePhoto(index) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Photos ({filledPhotos.length}/{MAX_PHOTOS})
      </Text>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.slot}>
            {photo ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: colors.danger }]}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.removeBtnText}>X</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.addSlot,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: colors.borderLight,
                  },
                ]}
                onPress={() => showPicker(index)}
                disabled={!canAddMore}
              >
                <Text style={[styles.addIcon, { color: colors.text.disabled }]}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  slot: {
    width: 100,
    height: 100,
  },
  photoContainer: {
    width: 100,
    height: 100,
    position: 'relative' as const,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeBtn: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  removeBtnText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  addSlot: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  addIcon: {
    fontSize: 32,
  },
});
