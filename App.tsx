import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';

import { RootStackParamList, TabParamList } from './src/types';
import PlantsScreen from './src/screens/PlantsScreen';
import PlantDetailScreen from './src/screens/PlantDetailScreen';
import AddPlantScreen from './src/screens/AddPlantScreen';
import SelectSpeciesScreen from './src/screens/SelectSpeciesScreen';
import WateringScreen from './src/screens/WateringScreen';
import SpeciesScreen from './src/screens/SpeciesScreen';
import { palette } from './src/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.terracotta,
        tabBarInactiveTintColor: '#8e98a3',
        tabBarStyle: {
          backgroundColor: palette.surfaceStrong,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          paddingBottom: 8,
          paddingTop: 6,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Plants"
        component={PlantsScreen}
        options={{
          tabBarLabel: 'Mes Plantes',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? '🌿' : '🪴'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Watering"
        component={WateringScreen}
        options={{
          tabBarLabel: 'Arrosage',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? '💧' : '🫧'}</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Species"
        component={SpeciesScreen}
        options={{
          tabBarLabel: 'Espèces',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? '📚' : '📖'}</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response.notification.request.content.data);
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: palette.night },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700', color: '#fff' },
            contentStyle: { backgroundColor: palette.background },
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PlantDetail"
            component={PlantDetailScreen}
            options={{ title: 'Détail', headerBackTitle: 'Retour' }}
          />
          <Stack.Screen
            name="AddPlant"
            component={AddPlantScreen}
            options={({ route }) => ({
              title: route.params?.plantId ? 'Modifier la plante' : 'Nouvelle plante',
              headerBackTitle: 'Retour',
            })}
          />
          <Stack.Screen
            name="SelectSpecies"
            component={SelectSpeciesScreen}
            options={{ title: 'Choisir une espèce', headerBackTitle: 'Retour' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
