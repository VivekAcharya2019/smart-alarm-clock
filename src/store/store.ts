import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import alarmsReducer from './slices/alarmsSlice';
import settingsReducer from './slices/settingsSlice';
import historyReducer from './slices/historySlice';

// Redux-persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['alarms', 'settings', 'history'], // Persist all slices
};

// Combine reducers
const rootReducer = combineReducers({
  alarms: alarmsReducer,
  settings: settingsReducer,
  history: historyReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
