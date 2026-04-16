import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Alarm } from '../../models';
import { calculateNextTrigger } from '../../utils/timeUtils';

interface AlarmsState {
  alarms: Alarm[];
}

const initialState: AlarmsState = {
  alarms: [],
};

const alarmsSlice = createSlice({
  name: 'alarms',
  initialState,
  reducers: {
    addAlarm: (state, action: PayloadAction<Alarm>) => {
      state.alarms.push(action.payload);
    },

    updateAlarm: (state, action: PayloadAction<Alarm>) => {
      const index = state.alarms.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.alarms[index] = action.payload;
      }
    },

    deleteAlarm: (state, action: PayloadAction<string>) => {
      state.alarms = state.alarms.filter(a => a.id !== action.payload);
    },

    toggleAlarm: (state, action: PayloadAction<string>) => {
      const alarm = state.alarms.find(a => a.id === action.payload);
      if (alarm) {
        alarm.enabled = !alarm.enabled;
        if (alarm.enabled) {
          // Recalculate next trigger when enabling
          alarm.nextTrigger = calculateNextTrigger(alarm);
        }
      }
    },

    updateNextTrigger: (state, action: PayloadAction<{ id: string; nextTrigger: number }>) => {
      const alarm = state.alarms.find(a => a.id === action.payload.id);
      if (alarm) {
        alarm.nextTrigger = action.payload.nextTrigger;
      }
    },

    setAlarms: (state, action: PayloadAction<Alarm[]>) => {
      state.alarms = action.payload;
    },
  },
});

export const {
  addAlarm,
  updateAlarm,
  deleteAlarm,
  toggleAlarm,
  updateNextTrigger,
  setAlarms,
} = alarmsSlice.actions;

export default alarmsSlice.reducer;

// Selectors
export const selectAllAlarms = (state: { alarms: AlarmsState }) => state.alarms.alarms;

export const selectEnabledAlarms = (state: { alarms: AlarmsState }) =>
  state.alarms.alarms.filter(a => a.enabled);

export const selectNextAlarm = (state: { alarms: AlarmsState }) => {
  const enabledAlarms = state.alarms.alarms.filter(a => a.enabled);
  if (enabledAlarms.length === 0) return null;

  return enabledAlarms.reduce((next, alarm) => {
    if (!next || alarm.nextTrigger < next.nextTrigger) {
      return alarm;
    }
    return next;
  });
};

export const selectAlarmById = (state: { alarms: AlarmsState }, id: string) =>
  state.alarms.alarms.find(a => a.id === id);
