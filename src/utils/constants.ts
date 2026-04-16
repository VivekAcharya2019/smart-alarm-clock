// Snooze durations in minutes
export const SNOOZE_DURATIONS = [5, 10, 15, 20, 30];

// Days of week
export const DAYS_OF_WEEK = [
  { short: 'S', long: 'Sunday', value: 0 },
  { short: 'M', long: 'Monday', value: 1 },
  { short: 'T', long: 'Tuesday', value: 2 },
  { short: 'W', long: 'Wednesday', value: 3 },
  { short: 'T', long: 'Thursday', value: 4 },
  { short: 'F', long: 'Friday', value: 5 },
  { short: 'S', long: 'Saturday', value: 6 },
];

// Vibration patterns (in milliseconds)
export const VIBRATION_PATTERNS = {
  default: [0, 500, 200, 500],
  pulse: [0, 200, 100, 200, 100, 200],
  crescendo: [0, 300, 200, 400, 200, 500],
};

// Ringtone options
export const DEFAULT_RINGTONES = [
  { label: 'Default', value: 'default' },
  { label: 'Gentle', value: 'gentle' },
  { label: 'Loud', value: 'loud' },
  { label: 'Classic', value: 'classic' },
];

// Challenge difficulties
export const CHALLENGE_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

// Storage keys
export const STORAGE_KEYS = {
  ALARMS: '@alarms',
  SETTINGS: '@settings',
  HISTORY: '@history',
};

// Notification channel
export const NOTIFICATION_CHANNEL_ID = 'alarm_notifications';
export const NOTIFICATION_CHANNEL_NAME = 'Alarm Notifications';

// Permissions
export const PERMISSIONS = {
  EXACT_ALARM: 'android.permission.SCHEDULE_EXACT_ALARM',
  POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
};
