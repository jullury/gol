import { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BusForm from '../components/BusForm';
import { getBusById } from '../db/bus-repository';
import { Bus } from '../types/bus';
import type { BusStackParamList } from '../navigation/BusStackNavigator';
import { useTheme, useThemeStyles } from '../theme';

export default function BusFormScreen() {
  const route = useRoute<RouteProp<BusStackParamList, 'BusForm'>>();
  const navigation = useNavigation<NativeStackNavigationProp<BusStackParamList>>();
  const busId = route.params?.busId;

  const [existingBus, setExistingBus] = useState<Bus | undefined>();
  const [isLoading, setIsLoading] = useState(!!busId);
  const { colors, fonts } = useTheme();
  const styles = useThemeStyles(createStyles);

  useEffect(() => {
    if (busId) {
      loadBus(busId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busId]);

  async function loadBus(id: string) {
    try {
      const bus = await getBusById(id);
      if (bus) {
        setExistingBus(bus);
      } else {
        Alert.alert('Error', 'Bus not found.');
        navigation.goBack();
      }
    } catch {
      Alert.alert('Error', 'Failed to load bus.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <BusForm existingBus={existingBus} onSave={handleSave} onCancel={handleCancel} />;
}

const createStyles = ({ colors, fonts }: ReturnType<typeof useTheme>) => ({
  loading: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
