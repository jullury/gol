import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RouteListScreen from '../screens/RouteListScreen';
import RouteDetailScreen from '../screens/RouteDetailScreen';
import StopFormScreen from '../screens/StopFormScreen';

export type RouteStackParamList = {
  RouteList: undefined;
  RouteDetail: { routeId?: string } | undefined;
  StopForm: { routeId: string; stopId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RouteStackParamList>();

export default function RouteStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RouteList"
        component={RouteListScreen}
        options={({ navigation }) => ({
          title: 'Routes',
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
      <Stack.Screen name="RouteDetail" component={RouteDetailScreen} options={{ title: 'Route' }} />
      <Stack.Screen name="StopForm" component={StopFormScreen} options={{ title: 'Stop' }} />
    </Stack.Navigator>
  );
}
