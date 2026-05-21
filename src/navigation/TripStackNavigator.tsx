import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TripListScreen from '../screens/TripListScreen';
import TripFormScreen from '../screens/TripFormScreen';
import TripDetailScreen from '../screens/TripDetailScreen';

export type TripStackParamList = {
  TripList: undefined;
  TripForm: undefined;
  TripDetail: { tripId: string };
};

const Stack = createNativeStackNavigator<TripStackParamList>();

export default function TripStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="TripList" component={TripListScreen} options={{ title: 'Trips' }} />
      <Stack.Screen
        name="TripForm"
        component={TripFormScreen}
        options={{ title: 'Start Trip' }}
      />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: 'Trip Details' }}
      />
    </Stack.Navigator>
  );
}
