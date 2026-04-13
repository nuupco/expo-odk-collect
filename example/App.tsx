import React, { useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { odk } from 'expo-odk-collect';

import { HomeScreen } from './src/screens/HomeScreen';
import { FormsScreen } from './src/screens/FormsScreen';
import { ExternalAppScreen } from './src/screens/ExternalAppScreen';

export type RootStackParamList = {
  Home: undefined;
  Forms: undefined;
  ExternalApp: { uuid?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const navigationRef = React.useRef<NavigationContainerRef<RootStackParamList>>(null);

  // ODK deep-link handling: cold launch + singleTask re-open
  useEffect(() => {
    const handleOdkIntent = async () => {
      const extras = await odk.getIntentExtras();
      if (extras['screen'] === 'external-app') {
        setTimeout(() => {
          navigationRef.current?.navigate('ExternalApp', { uuid: extras['uuid'] });
        }, 500);
      }
    };
    handleOdkIntent();
    const sub = Linking.addEventListener('url', handleOdkIntent);
    return () => sub.remove();
  }, []);

  // Global ODK error listener (was in _layout.tsx)
  useEffect(() => {
    const sub = odk.onError((event) => {
      if (!event) return;
      Alert.alert(`Error ODK: ${event.code}`, event.message);
    });
    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'ODK Collect Demo' }} />
        <Stack.Screen name="Forms" component={FormsScreen} options={{ title: 'Lista de Formularios' }} />
        <Stack.Screen name="ExternalApp" component={ExternalAppScreen} options={{ title: 'Modo App Externa' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
