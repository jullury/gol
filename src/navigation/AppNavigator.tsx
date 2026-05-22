import { createDrawerNavigator } from '@react-navigation/drawer';
import BusStackNavigator from './BusStackNavigator';
import TripStackNavigator from './TripStackNavigator';
import RouteStackNavigator from './RouteStackNavigator';

export type DrawerParamList = {
  Buses: undefined;
  Trips: undefined;
  Routes: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function AppNavigator() {
  return (
    <Drawer.Navigator>
      <Drawer.Screen
        name="Buses"
        component={BusStackNavigator}
        options={{ title: 'Buses', headerShown: false }}
      />
      <Drawer.Screen
        name="Trips"
        component={TripStackNavigator}
        options={{ title: 'Trips', headerShown: false }}
      />
      <Drawer.Screen
        name="Routes"
        component={RouteStackNavigator}
        options={{ title: 'Routes', headerShown: false }}
      />
    </Drawer.Navigator>
  );
}
