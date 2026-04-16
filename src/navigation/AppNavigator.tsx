import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { AddEditAlarmScreen } from '../screens/AddEditAlarmScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Smart Alarm Clock' }}
        />
        <Stack.Screen
          name="AddEditAlarm"
          component={AddEditAlarmScreen}
          options={({ route }) => ({
            title: route.params?.alarmId ? 'Edit Alarm' : 'New Alarm',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
