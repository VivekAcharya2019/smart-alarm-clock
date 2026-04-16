import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Settings, defaultSettings } from '../../models';

interface SettingsState {
  settings: Settings;
}

const initialState: SettingsState = {
  settings: defaultSettings,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<Settings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    setSettings: (state, action: PayloadAction<Settings>) => {
      state.settings = action.payload;
    },

    resetSettings: (state) => {
      state.settings = defaultSettings;
    },
  },
});

export const { updateSettings, setSettings, resetSettings } = settingsSlice.actions;

export default settingsSlice.reducer;

// Selectors
export const selectSettings = (state: { settings: SettingsState }) => state.settings.settings;

export const selectTimeFormat = (state: { settings: SettingsState }) =>
  state.settings.settings.timeFormat;

export const selectDefaultSnooze = (state: { settings: SettingsState }) =>
  state.settings.settings.defaultSnooze;
