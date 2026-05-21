import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MAX_PHOTOS } from '../constants/bus';

interface PhotoPickerProps {
  photos: (string | null)[];
  onPhotosChange: (photos: (string | null)[]) => void;
}

export default function PhotoPicker({ photos, onPhotosChange }: PhotoPickerProps) {
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
                <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(index)}>
                  <Text style={styles.removeBtnText}>X</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addSlot}
                onPress={() => showPicker(index)}
                disabled={!canAddMore}
              >
                <Text style={styles.addIcon}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  slot: {
    width: 100,
    height: 100,
  },
  photoContainer: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  addSlot: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  addIcon: {
    fontSize: 32,
    color: '#9ca3af',
  },
});
