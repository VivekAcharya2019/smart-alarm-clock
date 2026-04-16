export interface Alarm {
  id: string;
  time: {
    hour: number; // 0-23
    minute: number; // 0-59
  };
  enabled: boolean;
  label: string;
  repeatDays: number[]; // 0-6 where 0=Sunday, 6=Saturday, empty array=one-time alarm
  ringtone: string; // URI or asset path
  volume: number; // 0-100
  vibrate: boolean;
  snoozeEnabled: boolean;
  snoozeDuration: number; // Minutes (5, 10, 15)
  snoozeLimit: number; // Max snooze count (0=unlimited)
  gradualVolume: boolean;
  dismissChallenge: 'none' | 'math' | 'shake';
  challengeDifficulty: 'easy' | 'medium' | 'hard';
  createdAt: number; // Timestamp
  nextTrigger: number; // Timestamp of next scheduled trigger
}

export const defaultAlarm: Partial<Alarm> = {
  enabled: true,
  label: 'Alarm',
  repeatDays: [],
  volume: 80,
  vibrate: true,
  snoozeEnabled: true,
  snoozeDuration: 10,
  snoozeLimit: 3,
  gradualVolume: false,
  dismissChallenge: 'none',
  challengeDifficulty: 'medium',
};
