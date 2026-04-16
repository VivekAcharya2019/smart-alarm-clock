export interface Settings {
  defaultSnooze: number; // Minutes
  defaultVolume: number; // 0-100
  timeFormat: '12' | '24';
  defaultRingtone: string;
  vibrationPattern: 'default' | 'pulse' | 'crescendo';
  showMissedAlarms: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export const defaultSettings: Settings = {
  defaultSnooze: 10,
  defaultVolume: 80,
  timeFormat: '12',
  defaultRingtone: 'default',
  vibrationPattern: 'default',
  showMissedAlarms: true,
  theme: 'auto',
};
