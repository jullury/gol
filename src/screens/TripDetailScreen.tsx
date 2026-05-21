import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CashFlowSummary from '../components/CashFlowSummary';
import TripEventLog from '../components/TripEventLog';
import TripMinimap from '../components/TripMinimap';
import {
  getTripById,
  getTripEvents,
  addTripEvent,
  endTrip,
  reconstructState,
} from '../db/trip-repository';
import { getBusById } from '../db/bus-repository';
import { Trip, TripEvent, TripState, PassengerState } from '../types/trip';
import type { TripStackParamList } from '../navigation/TripStackNavigator';
import type { Bus } from '../types/bus';

export default function TripDetailScreen() {
  const route = useRoute<RouteProp<TripStackParamList, 'TripDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<TripStackParamList>>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [bus, setBus] = useState<Bus | null>(null);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [passengerLabel, setPassengerLabel] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [actionType, setActionType] = useState<string | null>(null);
  const passengerInputRef = useRef<TextInput>(null);

  const isActive = trip?.endDateTime === null;

  useFocusEffect(
    useCallback(() => {
      loadTrip();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripId]),
  );

  async function loadTrip() {
    setIsLoading(true);
    try {
      const data = await getTripById(tripId);
      setTrip(data);
      if (data) {
        const busData = await getBusById(data.busId);
        setBus(busData);
      }
      const eventData = await getTripEvents(tripId);
      setEvents(eventData);
    } catch {
      Alert.alert('Error', 'Failed to load trip.');
    } finally {
      setIsLoading(false);
    }
  }

  const state: TripState | null = trip && events.length > 0 ? reconstructState(trip, events) : null;

  function handleEndTrip() {
    Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Trip',
        style: 'destructive',
        onPress: async () => {
          await endTrip(tripId);
          await addTripEvent({
            tripId,
            type: 'TRIP_END',
            label: 'Trip ended',
            data: JSON.stringify({ endDateTime: Date.now() }),
          });
          loadTrip();
        },
      },
    ]);
  }

  function openAction(type: string) {
    setActionType(type);
    setPassengerLabel('');
    setCashAmount('');
    setShowActionSheet(true);
    setTimeout(() => passengerInputRef.current?.focus(), 100);
  }

  async function handleActionSubmit() {
    if (!actionType || !passengerLabel.trim()) {
      Alert.alert('Required', 'Passenger label is required.');
      return;
    }

    if ((actionType === 'CASH_IN' || actionType === 'CASH_OUT') && !cashAmount.trim()) {
      Alert.alert('Required', 'Amount is required.');
      return;
    }

    try {
      const data: Record<string, unknown> = {};

      if (actionType === 'CASH_IN' || actionType === 'CASH_OUT') {
        data.amount = parseInt(cashAmount, 10);
        if (isNaN(data.amount as number) || (data.amount as number) <= 0) {
          Alert.alert('Invalid', 'Amount must be a positive number.');
          return;
        }
      }

      await addTripEvent({
        tripId,
        type: actionType as TripEvent['type'],
        label: passengerLabel.trim(),
        data: JSON.stringify(data),
      });

      setShowActionSheet(false);
      setActionType(null);
      setPassengerLabel('');
      setCashAmount('');
      loadTrip();
    } catch {
      Alert.alert('Error', 'Failed to record action.');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Trip not found.</Text>
      </View>
    );
  }

  const passengerCount = state ? Array.from(state.passengers.values()).length : 0;
  const activePassengerCount = state
    ? Array.from(state.passengers.values()).filter((p) => p.alightedAt === null).length
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Text style={styles.busNumero}>{bus?.numero ?? 'Unknown Bus'}</Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Started</Text>
            <Text style={styles.headerValue}>
              {new Date(trip.startDateTime).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {trip.endDateTime && (
            <View style={styles.headerRow}>
              <Text style={styles.headerLabel}>Ended</Text>
              <Text style={styles.headerValue}>
                {new Date(trip.endDateTime).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>

        <TripMinimap events={events} scrollEnabled={!isActive} />

        <CashFlowSummary
          totalCashIn={state?.totalCashIn ?? 0}
          totalCashOut={state?.totalCashOut ?? 0}
          netCashFlow={state?.netCashFlow ?? 0}
          passengerCount={passengerCount}
          activePassengerCount={activePassengerCount}
        />

        <TripEventLog events={events} />
      </ScrollView>

      {isActive && (
        <View style={styles.fabContainer}>
          <TouchableOpacity style={styles.fabAction} onPress={() => openAction('PASSENGER_BOARD')}>
            <Text style={styles.fabActionText}>Board</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabAction} onPress={() => openAction('CASH_IN')}>
            <Text style={styles.fabActionText}>Cash In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabAction} onPress={() => openAction('CASH_OUT')}>
            <Text style={styles.fabActionText}>Cash Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabAction} onPress={() => openAction('PASSENGER_ALIGHT')}>
            <Text style={styles.fabActionText}>Alight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.endTripFab} onPress={handleEndTrip}>
            <Text style={styles.endTripFabText}>End</Text>
          </TouchableOpacity>
        </View>
      )}

      {showActionSheet && (
        <View style={styles.overlay}>
          <View style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>
              {actionType === 'PASSENGER_BOARD' && 'Passenger Boarding'}
              {actionType === 'PASSENGER_ALIGHT' && 'Passenger Alighting'}
              {actionType === 'CASH_IN' && 'Cash Received'}
              {actionType === 'CASH_OUT' && 'Cash Returned'}
            </Text>

            <Text style={styles.fieldLabel}>Passenger Label</Text>
            <TextInput
              ref={passengerInputRef}
              style={styles.input}
              value={passengerLabel}
              onChangeText={setPassengerLabel}
              placeholder="e.g. Seat 1 or name"
            />

            {(actionType === 'CASH_IN' || actionType === 'CASH_OUT') && (
              <>
                <Text style={styles.fieldLabel}>Amount (Ar)</Text>
                <TextInput
                  style={styles.input}
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  placeholder="e.g. 10000"
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={styles.actionSheetBtns}>
              <TouchableOpacity
                style={[styles.actionSheetBtn, styles.actionSheetCancel]}
                onPress={() => setShowActionSheet(false)}
              >
                <Text style={styles.actionSheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionSheetBtn, styles.actionSheetConfirm]}
                onPress={handleActionSubmit}
              >
                <Text style={styles.actionSheetConfirmText}>Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 100,
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
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busNumero: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  activeBadgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  fabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 6,
  },
  fabAction: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  endTripFab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endTripFabText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  actionSheetBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionSheetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionSheetCancel: {
    backgroundColor: '#f3f4f6',
  },
  actionSheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  actionSheetConfirm: {
    backgroundColor: '#2563eb',
  },
  actionSheetConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
