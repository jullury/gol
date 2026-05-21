import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
      <Stack.Screen
        name="TripList"
        component={TripListScreen}
        options={({ navigation }) => ({
          title: 'Trips',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={{ paddingRight: 8 }}
            >
              <Ionicons name="menu" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="TripForm" component={TripFormScreen} options={{ title: 'Start Trip' }} />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: 'Trip Details' }}
      />
    </Stack.Navigator>
  );
}
