import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BusListScreen from '../screens/BusListScreen';
import BusFormScreen from '../screens/BusFormScreen';
import BusDetailScreen from '../screens/BusDetailScreen';

export type BusStackParamList = {
  BusList: undefined;
  BusForm: { busId?: string } | undefined;
  BusDetail: { busId: string };
};

const Stack = createNativeStackNavigator<BusStackParamList>();

export default function BusStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="BusList"
        component={BusListScreen}
        options={({ navigation }) => ({
          title: 'Buses',
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
      <Stack.Screen name="BusForm" component={BusFormScreen} options={{ title: 'Bus' }} />
      <Stack.Screen
        name="BusDetail"
        component={BusDetailScreen}
        options={{ title: 'Bus Details' }}
      />
    </Stack.Navigator>
  );
}
