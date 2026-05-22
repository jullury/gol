import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import * as Crypto from 'expo-crypto';
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
import { getStopsForRoute } from '../db/route-repository';
import { Trip, TripEvent, TripState } from '../types/trip';
import { RouteStop } from '../types/route';
import type { TripStackParamList } from '../navigation/TripStackNavigator';
import type { Bus } from '../types/bus';
import { useTheme, useThemeStyles } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [actionType, setActionType] = useState<'CASH_IN' | 'CASH_OUT' | null>(null);
  const [moveSeat, setMoveSeat] = useState<string | null>(null);
  const [seatActionLabel, setSeatActionLabel] = useState<string | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [showBoardStopPicker, setShowBoardStopPicker] = useState(false);
  const [pendingBoardSeatId, setPendingBoardSeatId] = useState<string | null>(null);
  const [showAlightStopPicker, setShowAlightStopPicker] = useState(false);
  const [pendingAlightLabel, setPendingAlightLabel] = useState<string | null>(null);
  const [showFillStopPicker, setShowFillStopPicker] = useState(false);
  const [pendingFillSeatIds, setPendingFillSeatIds] = useState<string[]>([]);
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isMountedRef = useRef(true);

  const isActive = trip?.endDateTime === null;

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      loadTrip();
      return () => {
        isMountedRef.current = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tripId]),
  );

  async function loadTrip() {
    setIsLoading(true);
    try {
      const data = await getTripById(tripId);
      if (!isMountedRef.current) return;
      setTrip(data);
      if (data) {
        const [busData, stopData] = await Promise.all([
          getBusById(data.busId),
          data.routeId ? getStopsForRoute(data.routeId) : [],
        ]);
        if (!isMountedRef.current) return;
        setBus(busData);
        setStops(stopData);
      }
      const eventData = await getTripEvents(tripId);
      if (isMountedRef.current) {
        setEvents(eventData);
      }
    } catch {
      Alert.alert('Error', 'Failed to load trip.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }

  const state: TripState | null = trip && events.length > 0 ? reconstructState(trip, events) : null;

  const occupiedSeats = useMemo(() => {
    const seats = new Set<number>();
    if (state) {
      for (const p of state.passengers.values()) {
        if (p.alightedAt === null && p.seatNumber !== null) {
          seats.add(p.seatNumber);
        }
      }
    }
    return seats;
  }, [state]);

  const tempSeats = useMemo(() => {
    const slots: string[] = [];
    if (state) {
      for (const p of state.passengers.values()) {
        if (p.alightedAt !== null || p.tempSlot === null) continue;
        slots.push(`temp-${p.tempSlot}`);
      }
    }
    slots.sort();
    return slots;
  }, [state]);

  const emptySeatIds = useMemo(() => {
    if (!bus) return [];
    const totalSeats = bus.numberOfPlace;
    const ids: string[] = [];
    for (let i = 1; i <= totalSeats; i++) {
      if (!occupiedSeats.has(i)) {
        ids.push(i.toString());
      }
    }
    return ids;
  }, [bus, occupiedSeats]);

  const seatPassenger = useMemo(() => {
    if (!state || seatActionLabel === null) return null;
    const isTempSeat = seatActionLabel.startsWith('temp-');
    for (const p of state.passengers.values()) {
      if (p.alightedAt !== null) continue;
      if (isTempSeat) {
        if (p.tempSlot === parseInt(seatActionLabel.slice(5), 10)) return p;
      } else {
        if (p.seatNumber === parseInt(seatActionLabel, 10)) return p;
      }
    }
    return null;
  }, [state, seatActionLabel]);

  const canCashOut = seatPassenger !== null && seatPassenger.cashIn > seatPassenger.cashOut;

  function getPassengerBySeat(seatId: string) {
    if (!state) return null;
    const isTempSeat = seatId.startsWith('temp-');
    for (const p of state.passengers.values()) {
      if (p.alightedAt !== null) continue;
      if (isTempSeat) {
        if (p.tempSlot === parseInt(seatId.slice(5), 10)) return p;
      } else {
        if (p.seatNumber === parseInt(seatId, 10)) return p;
      }
    }
    return null;
  }

  async function handleMovePassenger(fromSeatId: string, toSeatId: string) {
    const passenger = getPassengerBySeat(fromSeatId);
    if (!passenger) return;
    const isTempTo = toSeatId.startsWith('temp-');
    const data = isTempTo
      ? { toTempSlot: parseInt(toSeatId.slice(5), 10) }
      : { toSeatNumber: parseInt(toSeatId, 10) };
    try {
      await addTripEvent({
        tripId,
        type: 'PASSENGER_CHANGE_SEAT',
        label: passenger.label,
        data: JSON.stringify(data),
      });
      loadTrip();
    } catch {
      Alert.alert('Error', 'Failed to move passenger.');
    }
  }

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

  function handleBoardSeat(seatId: string) {
    if (stops.length > 0) {
      setPendingBoardSeatId(seatId);
      setShowBoardStopPicker(true);
    } else {
      doBoard(seatId);
    }
  }

  async function refreshEvents() {
    try {
      const [eventData, tripData] = await Promise.all([getTripEvents(tripId), getTripById(tripId)]);
      if (isMountedRef.current) {
        setTrip(tripData);
        setEvents(eventData);
      }
    } catch {
      // silent refresh failure
    }
  }

  async function doBoard(seatId: string, boardStopId?: string) {
    const hexLabel = Crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    const isTempSeat = seatId.startsWith('temp-');
    const data: Record<string, unknown> = isTempSeat
      ? { tempSlot: parseInt(seatId.slice(5), 10) }
      : { seatNumber: parseInt(seatId, 10) };
    if (boardStopId) {
      data.boardStopId = boardStopId;
    }
    try {
      await addTripEvent({
        tripId,
        type: 'PASSENGER_BOARD',
        label: hexLabel,
        data: JSON.stringify(data),
      });
      refreshEvents();
    } catch {
      Alert.alert('Error', 'Failed to board passenger.');
    }
  }

  function handleOccupiedSeatTap(seatId: string) {
    setSeatActionLabel(seatId);
  }

  function handleSeatAlight(seatId: string) {
    setSeatActionLabel(null);
    const passenger = getPassengerBySeat(seatId);
    if (!passenger) return;
    if (stops.length > 0) {
      setPendingAlightLabel(passenger.label);
      setShowAlightStopPicker(true);
    } else {
      doAlight(passenger.label);
    }
  }

  async function doAlight(passengerLabel: string, alightStopId?: string) {
    const data = alightStopId ? JSON.stringify({ alightStopId }) : '{}';
    try {
      await addTripEvent({
        tripId,
        type: 'PASSENGER_ALIGHT',
        label: passengerLabel,
        data,
      });
      refreshEvents();
    } catch {
      Alert.alert('Error', 'Failed to record alight.');
    }
  }

  function handleFillBus() {
    if (emptySeatIds.length === 0) return;
    if (stops.length > 0) {
      setPendingFillSeatIds(emptySeatIds);
      setShowFillStopPicker(true);
    } else {
      doFillBus(emptySeatIds);
    }
  }

  async function doFillBus(seatIds: string[], boardStopId?: string) {
    try {
      for (const seatId of seatIds) {
        const hexLabel = Crypto.randomUUID().replace(/-/g, '').slice(0, 8);
        const data: Record<string, unknown> = { seatNumber: parseInt(seatId, 10) };
        if (boardStopId) {
          data.boardStopId = boardStopId;
        }
        await addTripEvent({
          tripId,
          type: 'PASSENGER_BOARD',
          label: hexLabel,
          data: JSON.stringify(data),
        });
      }
      refreshEvents();
    } catch {
      Alert.alert('Error', 'Failed to fill bus.');
    }
  }

  function handleSeatCash(seatId: string, type: 'CASH_IN' | 'CASH_OUT') {
    setSeatActionLabel(null);
    const passenger = getPassengerBySeat(seatId);
    if (!passenger) return;
    setActionType(type);
    setPassengerLabel(passenger.label);
    setCashAmount('');
    setMoveSeat(null);
    setShowActionSheet(true);
  }

  function handleSeatMove(seatId: string) {
    setSeatActionLabel(null);
    setMoveSeat(seatId);
  }

  async function handleActionSubmit() {
    if (!actionType || !cashAmount.trim()) {
      Alert.alert('Required', 'Amount is required.');
      return;
    }

    const amount = parseInt(cashAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid', 'Amount must be a positive number.');
      return;
    }

    try {
      await addTripEvent({
        tripId,
        type: actionType,
        label: passengerLabel,
        data: JSON.stringify({ amount }),
      });

      setShowActionSheet(false);
      setActionType(null);
      setPassengerLabel('');
      setCashAmount('');
      refreshEvents();
    } catch {
      Alert.alert('Error', 'Failed to record action.');
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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

        {bus && (
          <TripMinimap
            seatColumns={bus.seatColumns}
            seatRows={bus.seatRows}
            driverSeatCount={bus.driverSeatCount}
            occupiedSeats={occupiedSeats}
            onMovePassenger={handleMovePassenger}
            onBoardSeat={isActive ? handleBoardSeat : () => {}}
            onOccupiedSeatTap={isActive ? handleOccupiedSeatTap : () => {}}
            tempSeats={tempSeats}
            selectedSeatLabel={moveSeat}
            onSeatSelect={setMoveSeat}
          />
        )}

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
          <TouchableOpacity style={styles.endTripFab} onPress={handleEndTrip}>
            <Text style={styles.endTripFabText}>End Trip</Text>
          </TouchableOpacity>
          {emptySeatIds.length > 0 && (
            <TouchableOpacity style={styles.fillBusFab} onPress={handleFillBus}>
              <Text style={styles.fillBusFabText}>Fill Bus ({emptySeatIds.length})</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {seatActionLabel !== null && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => setSeatActionLabel(null)}
          />
          <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.actionSheetTitle}>Seat {seatActionLabel}</Text>
            {seatPassenger && (
              <View style={styles.seatCashInfo}>
                <Text style={styles.seatCashInfoText}>
                  In: {seatPassenger.cashIn.toLocaleString()} Ar
                </Text>
                <Text style={styles.seatCashInfoText}>
                  Out: {seatPassenger.cashOut.toLocaleString()} Ar
                </Text>
                <Text
                  style={[
                    styles.seatCashInfoText,
                    {
                      color:
                        seatPassenger.cashIn - seatPassenger.cashOut > 0
                          ? colors.success
                          : colors.text.secondary,
                    },
                  ]}
                >
                  Net: {(seatPassenger.cashIn - seatPassenger.cashOut).toLocaleString()} Ar
                </Text>
              </View>
            )}
            <View style={styles.seatActionGrid}>
              <View style={styles.seatActionRow}>
                <TouchableOpacity
                  style={[styles.seatActionBtn, { backgroundColor: colors.danger }]}
                  onPress={() => handleSeatAlight(seatActionLabel)}
                >
                  <Text style={styles.seatActionBtnText}>Alight</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.seatActionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleSeatCash(seatActionLabel, 'CASH_IN')}
                >
                  <Text style={styles.seatActionBtnText}>Cash In</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.seatActionRow}>
                <TouchableOpacity
                  style={[
                    styles.seatActionBtn,
                    { backgroundColor: colors.primary, opacity: canCashOut ? 1 : 0.4 },
                  ]}
                  onPress={() => {
                    if (canCashOut) handleSeatCash(seatActionLabel, 'CASH_OUT');
                  }}
                >
                  <Text style={styles.seatActionBtnText}>Cash Out</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.seatActionBtn, { backgroundColor: colors.warning }]}
                  onPress={() => handleSeatMove(seatActionLabel)}
                >
                  <Text style={[styles.seatActionBtnText, { color: colors.warningText }]}>
                    Move
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {showActionSheet && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => setShowActionSheet(false)}
          />
          <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.actionSheetTitle}>
              {actionType === 'CASH_IN' ? 'Cash Received' : 'Cash Returned'}
            </Text>

            <Text style={styles.fieldLabel}>Amount (Ar)</Text>
            <TextInput
              style={styles.input}
              value={cashAmount}
              onChangeText={setCashAmount}
              placeholder="e.g. 10000"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
              autoFocus
            />

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

      {showBoardStopPicker && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowBoardStopPicker(false);
              setPendingBoardSeatId(null);
            }}
          />
          <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.actionSheetTitle}>Select Boarding Stop</Text>
            <FlatList
              data={stops}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.stopPickerRow}
                  onPress={() => {
                    setShowBoardStopPicker(false);
                    const seatId = pendingBoardSeatId;
                    setPendingBoardSeatId(null);
                    if (seatId) doBoard(seatId, item.id);
                  }}
                >
                  <View style={styles.stopOrderBadge}>
                    <Text style={styles.stopOrderBadgeText}>{item.orderNumber}</Text>
                  </View>
                  <Text style={styles.stopPickerName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.actionSheetCancel}
              onPress={() => {
                setShowBoardStopPicker(false);
                setPendingBoardSeatId(null);
              }}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showAlightStopPicker && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowAlightStopPicker(false);
              setPendingAlightLabel(null);
            }}
          />
          <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.actionSheetTitle}>Select Alighting Stop</Text>
            <FlatList
              data={stops}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.stopPickerRow}
                  onPress={() => {
                    setShowAlightStopPicker(false);
                    const label = pendingAlightLabel;
                    setPendingAlightLabel(null);
                    if (label) doAlight(label, item.id);
                  }}
                >
                  <View style={styles.stopOrderBadge}>
                    <Text style={styles.stopOrderBadgeText}>{item.orderNumber}</Text>
                  </View>
                  <Text style={styles.stopPickerName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.actionSheetCancel}
              onPress={() => {
                setShowAlightStopPicker(false);
                setPendingAlightLabel(null);
              }}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showFillStopPicker && (
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.overlayBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowFillStopPicker(false);
              setPendingFillSeatIds([]);
            }}
          />
          <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.actionSheetTitle}>Select Boarding Stop</Text>
            <FlatList
              data={stops}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.stopPickerRow}
                  onPress={() => {
                    setShowFillStopPicker(false);
                    const ids = pendingFillSeatIds;
                    setPendingFillSeatIds([]);
                    if (ids.length > 0) doFillBus(ids, item.id);
                  }}
                >
                  <View style={styles.stopOrderBadge}>
                    <Text style={styles.stopOrderBadgeText}>{item.orderNumber}</Text>
                  </View>
                  <Text style={styles.stopPickerName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.actionSheetCancel}
              onPress={() => {
                setShowFillStopPicker(false);
                setPendingFillSeatIds([]);
              }}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.muted,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busNumero: {
    fontSize: 22,
    fontWeight: '800' as const,
    fontFamily: fonts.extrabold,
    color: colors.text.primary,
    marginBottom: 8,
  },
  activeBadge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: colors.successBg,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  activeBadgeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  headerRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 4,
  },
  headerLabel: {
    fontSize: 14,
    color: colors.text.muted,
  },
  headerValue: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500' as const,
  },
  fabContainer: {
    flexDirection: 'row' as const,
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  endTripFab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  endTripFabText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  fillBusFab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  fillBusFabText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  seatCashInfo: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 6,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  seatCashInfoText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text.primary,
  },
  seatActionGrid: {
    gap: 10,
    marginBottom: 4,
  },
  seatActionRow: {
    flexDirection: 'row' as const,
    gap: 10,
  },
  seatActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  seatActionBtnText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end' as const,
  },
  overlayBackdrop: {
    flex: 1,
  },
  actionSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: fonts.bold,
    color: colors.text.primary,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: 8,
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
  actionSheetBtns: {
    flexDirection: 'row' as const,
    gap: 12,
    marginTop: 20,
  },
  actionSheetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center' as const,
  },
  actionSheetCancel: {
    backgroundColor: colors.border,
  },
  actionSheetCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.secondary,
  },
  actionSheetConfirm: {
    backgroundColor: colors.primary,
  },
  actionSheetConfirmText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text.inverse,
  },
  stopPickerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stopOrderBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  stopOrderBadgeText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  stopPickerName: {
    fontSize: 16,
    color: colors.text.primary,
  },
});
