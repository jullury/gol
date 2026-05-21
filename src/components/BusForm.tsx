import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Bus, BusFormData } from '../types/bus';
import PhotoPicker from './PhotoPicker';
import { createBus, updateBus } from '../db/bus-repository';
import { useTheme, useThemeStyles } from '../theme';

interface BusFormProps {
  existingBus?: Bus;
  onSave: () => void;
  onCancel: () => void;
}

export default function BusForm({ existingBus, onSave, onCancel }: BusFormProps) {
  const isEditing = !!existingBus;

  const [numero, setNumero] = useState(existingBus?.numero ?? '');
  const [name, setName] = useState(existingBus?.name ?? '');
  const [seatColumns, setSeatColumns] = useState<number>(existingBus?.seatColumns ?? 5);
  const [seatRows, setSeatRows] = useState<number>(existingBus?.seatRows ?? 4);
  const [driverSeatCount, setDriverSeatCount] = useState<number>(existingBus?.driverSeatCount ?? 2);
  const [photos, setPhotos] = useState<(string | null)[]>([
    existingBus?.photo1 ?? null,
    existingBus?.photo2 ?? null,
    existingBus?.photo3 ?? null,
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const { colors, fonts } = useTheme();
  const styles = useThemeStyles(createStyles);

  const totalSeats = useMemo(() => {
    const cols = seatColumns > 0 ? seatColumns : 1;
    const rows = seatRows > 0 ? seatRows : 1;
    return cols * rows + driverSeatCount;
  }, [seatColumns, seatRows, driverSeatCount]);

  const trimmedNumero = numero.trim();
  const trimmedName = name.trim();
  const isValid =
    trimmedNumero.length > 0 && trimmedName.length > 0 && seatColumns > 0 && seatRows > 0;

  async function handleSave() {
    if (!isValid) return;

    setIsSaving(true);
    try {
      const data: BusFormData = {
        numero: trimmedNumero,
        name: trimmedName,
        numberOfPlace: totalSeats,
        seatColumns,
        seatRows,
        driverSeatCount,
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

  function renderSeatPreview() {
    const cols = seatColumns > 0 ? seatColumns : 5;
    const rows = seatRows > 0 ? seatRows : 4;

    const gridSeats: React.ReactNode[] = [];
    const gridStart = 1 + driverSeatCount;
    for (let r = 0; r < rows; r++) {
      const rowSeats: React.ReactNode[] = [];
      for (let c = 0; c < cols; c++) {
        const seatNum = gridStart + r * cols + c;
        rowSeats.push(
          <View key={seatNum} style={[styles.previewSeat, styles.previewGridSeat]}>
            <Text style={styles.previewSeatText}>{seatNum}</Text>
          </View>,
        );
      }
      gridSeats.push(
        <View key={`row-${r}`} style={styles.previewRow}>
          {rowSeats}
        </View>,
      );
    }

    const frontSeats: React.ReactNode[] = [];
    for (let i = 1; i <= driverSeatCount; i++) {
      frontSeats.push(
        <View key={i} style={[styles.previewSeat, styles.previewGridSeat]}>
          <Text style={styles.previewSeatText}>{i}</Text>
        </View>,
      );
    }

    return (
      <View style={styles.previewContainer}>
        <View style={styles.previewFront}>
          <View style={[styles.previewSeat, styles.previewDriverSeat]}>
            <Text style={[styles.previewSeatText, { color: colors.warningText }]}>D</Text>
          </View>
          {frontSeats}
        </View>
        <View style={[styles.previewDivider, { backgroundColor: colors.border }]} />
        {gridSeats}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.fieldLabel}>Numero *</Text>
      <TextInput
        style={styles.input}
        value={numero}
        onChangeText={setNumero}
        placeholder="e.g. 2341TBB"
        placeholderTextColor={colors.text.disabled}
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
        placeholderTextColor={colors.text.disabled}
        editable={!isSaving}
      />
      {name.trim().length === 0 && <Text style={styles.error}>Required</Text>}

      <Text style={styles.fieldLabel}>Seat Grid</Text>
      <Text style={styles.hint}>Define the seat layout. Total = columns × rows + front seats</Text>

      <View style={styles.gridRow}>
        <View style={styles.gridField}>
          <Text style={styles.fieldLabel}>Columns</Text>
          <TextInput
            style={styles.input}
            value={seatColumns > 0 ? String(seatColumns) : ''}
            onChangeText={(text) => setSeatColumns(Math.max(1, Number(text) || 0))}
            placeholder="e.g. 5"
            placeholderTextColor={colors.text.disabled}
            keyboardType="numeric"
            editable={!isSaving}
          />
        </View>
        <View style={styles.gridField}>
          <Text style={styles.fieldLabel}>Rows</Text>
          <TextInput
            style={styles.input}
            value={seatRows > 0 ? String(seatRows) : ''}
            onChangeText={(text) => setSeatRows(Math.max(1, Number(text) || 0))}
            placeholder="e.g. 4"
            placeholderTextColor={colors.text.disabled}
            keyboardType="numeric"
            editable={!isSaving}
          />
        </View>
      </View>

      <View style={styles.driverSeatRow}>
        <Text style={styles.fieldLabel}>Front Seats</Text>
        <View style={styles.driverSeatToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, driverSeatCount === 1 && styles.toggleBtnActive]}
            onPress={() => setDriverSeatCount(1)}
            disabled={isSaving}
          >
            <Text
              style={[styles.toggleBtnText, driverSeatCount === 1 && styles.toggleBtnTextActive]}
            >
              1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, driverSeatCount === 2 && styles.toggleBtnActive]}
            onPress={() => setDriverSeatCount(2)}
            disabled={isSaving}
          >
            <Text
              style={[styles.toggleBtnText, driverSeatCount === 2 && styles.toggleBtnTextActive]}
            >
              2
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {seatColumns > 0 && seatRows > 0 && (
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total:{' '}
            <Text style={[styles.totalHighlight, { color: colors.success }]}>
              {seatColumns} × {seatRows} + {driverSeatCount} = {totalSeats} seats
            </Text>
          </Text>
        </View>
      )}

      {seatColumns > 0 && seatRows > 0 && renderSeatPreview()}

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
            <ActivityIndicator color={colors.text.inverse} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>{isEditing ? 'Update' : 'Create'}</Text>
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
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: 12,
  },
  hint: {
    fontSize: 13,
    color: colors.text.muted,
    marginBottom: 8,
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
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 2,
  },
  gridRow: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  gridField: {
    flex: 1,
  },
  driverSeatRow: {
    marginTop: 12,
  },
  driverSeatToggle: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    alignItems: 'center' as const,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.secondary,
  },
  toggleBtnTextActive: {
    color: colors.text.inverse,
  },
  totalContainer: {
    backgroundColor: colors.successBg,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  totalText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalHighlight: {
    fontWeight: '700' as const,
  },
  previewContainer: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    alignItems: 'center' as const,
  },
  previewFront: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingBottom: 8,
  },
  previewDriverSeat: {
    backgroundColor: colors.warningBg,
    borderColor: colors.warningBorder,
  },
  previewDivider: {
    width: '100%' as const,
    height: 1,
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row' as const,
    gap: 4,
    marginBottom: 4,
  },
  previewSeat: {
    width: 32,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  previewGridSeat: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  previewSeatText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: colors.text.secondary,
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
  saveBtn: {
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.inverse,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
