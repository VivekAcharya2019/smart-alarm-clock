export interface AlarmHistory {
  id: string;
  alarmId: string;
  alarmLabel: string;
  scheduledTime: number; // Timestamp when alarm was scheduled to fire
  actualTime: number; // Timestamp when action was taken
  action: 'dismissed' | 'snoozed' | 'missed';
  snoozeCount: number; // How many times this alarm was snoozed
  challenge: boolean; // Whether a challenge was completed
  timestamp: number; // Timestamp of the history entry
}
