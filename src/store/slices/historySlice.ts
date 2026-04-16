import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlarmHistory } from '../../models';

interface HistoryState {
  history: AlarmHistory[];
}

const initialState: HistoryState = {
  history: [],
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addHistoryEntry: (state, action: PayloadAction<AlarmHistory>) => {
      state.history.unshift(action.payload); // Add to beginning

      // Keep only last 100 entries
      if (state.history.length > 100) {
        state.history = state.history.slice(0, 100);
      }
    },

    clearHistory: (state) => {
      state.history = [];
    },

    setHistory: (state, action: PayloadAction<AlarmHistory[]>) => {
      state.history = action.payload;
    },
  },
});

export const { addHistoryEntry, clearHistory, setHistory } = historySlice.actions;

export default historySlice.reducer;

// Selectors
export const selectAllHistory = (state: { history: HistoryState }) => state.history.history;

export const selectRecentHistory = (state: { history: HistoryState }, limit: number = 10) =>
  state.history.history.slice(0, limit);

export const selectMissedAlarms = (state: { history: HistoryState }) =>
  state.history.history.filter(h => h.action === 'missed');
