import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Bus, BusFormData } from '../types/bus';
import PhotoPicker from './PhotoPicker';
import { createBus, updateBus } from '../db/bus-repository';

interface BusFormProps {
  existingBus?: Bus;
  onSave: () => void;
  onCancel: () => void;
}

export default function BusForm({ existingBus, onSave, onCancel }: BusFormProps) {
  const isEditing = !!existingBus;

  const [numero, setNumero] = useState(existingBus?.numero ?? '');
  const [name, setName] = useState(existingBus?.name ?? '');
  const [numberOfPlace, setNumberOfPlace] = useState<number>(existingBus?.numberOfPlace ?? 0);
  const [photos, setPhotos] = useState<(string | null)[]>([
    existingBus?.photo1 ?? null,
    existingBus?.photo2 ?? null,
    existingBus?.photo3 ?? null,
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedNumero = numero.trim();
  const trimmedName = name.trim();
  const isValid = trimmedNumero.length > 0 && trimmedName.length > 0;

  async function handleSave() {
    if (!isValid) return;

    setIsSaving(true);
    try {
      const data: BusFormData = {
        numero: trimmedNumero,
        name: trimmedName,
        numberOfPlace,
        photo1: photos[0] ?? null,
        photo2: photos[1] ?? null,
        photo3: photos[2] ?? null,
      };

      if (isEditing && existingBus) {
        await updateBus(existingBus.id, data);
      } else {
        await createBus(data);
      }

      onSave();
    } catch {
      Alert.alert('Error', 'Failed to save bus. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.fieldLabel}>Numero *</Text>
      <TextInput
        style={styles.input}
        value={numero}
        onChangeText={setNumero}
        placeholder="e.g. 2341TBB"
        autoCapitalize="characters"
        editable={!isSaving}
      />
      {numero.trim().length === 0 && <Text style={styles.error}>Required</Text>}

      <Text style={styles.fieldLabel}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Bus name"
        editable={!isSaving}
      />
      {name.trim().length === 0 && <Text style={styles.error}>Required</Text>}

      <Text style={styles.fieldLabel}>Number of Places *</Text>
      <TextInput
        style={styles.input}
        value={numberOfPlace > 0 ? String(numberOfPlace) : ''}
        onChangeText={(text) => setNumberOfPlace(Number(text) || 0)}
        placeholder="e.g. 22"
        keyboardType="numeric"
        editable={!isSaving}
      />

      <PhotoPicker photos={photos} onPhotosChange={setPhotos} />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.cancelBtn]}
          onPress={onCancel}
          disabled={isSaving}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.saveBtn, (!isValid || isSaving) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!isValid || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{isEditing ? 'Update' : 'Create'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  error: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
