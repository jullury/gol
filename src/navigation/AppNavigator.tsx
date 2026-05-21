import { createDrawerNavigator } from '@react-navigation/drawer';
import BusStackNavigator from './BusStackNavigator';

export type DrawerParamList = {
  Buses: undefined;
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
    </Drawer.Navigator>
  );
}
