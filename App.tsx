/**
 * Smart Alarm Clock - React Native App
 * Full-featured alarm clock with native Android AlarmManager integration
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import { AppNavigator } from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
        <AppNavigator />
      </PersistGate>
    </Provider>
  );
}

export default App;
