import { Alarm } from '../models';

/**
 * Calculate the next trigger time for an alarm based on its repeat pattern
 */
export function calculateNextTrigger(alarm: Alarm): number {
  const now = new Date();
  const alarmTime = new Date();
  alarmTime.setHours(alarm.time.hour);
  alarmTime.setMinutes(alarm.time.minute);
  alarmTime.setSeconds(0);
  alarmTime.setMilliseconds(0);

  // One-time alarm
  if (alarm.repeatDays.length === 0) {
    // If alarm time has passed today, schedule for tomorrow
    if (alarmTime.getTime() <= now.getTime()) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    return alarmTime.getTime();
  }

  // Repeating alarm - find next matching day
  for (let i = 0; i < 7; i++) {
    const testDate = new Date(now);
    testDate.setDate(testDate.getDate() + i);
    testDate.setHours(alarm.time.hour);
    testDate.setMinutes(alarm.time.minute);
    testDate.setSeconds(0);
    testDate.setMilliseconds(0);

    const dayOfWeek = testDate.getDay();

    if (alarm.repeatDays.includes(dayOfWeek) && testDate.getTime() > now.getTime()) {
      return testDate.getTime();
    }
  }

  // Fallback (should not reach here)
  return alarmTime.getTime();
}

/**
 * Format time for display (12 or 24 hour format)
 */
export function formatTime(hour: number, minute: number, format: '12' | '24'): string {
  if (format === '24') {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format time until alarm
 */
export function formatTimeUntil(triggerTime: number): string {
  const now = Date.now();
  const diff = triggerTime - now;

  if (diff <= 0) return 'Now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) {
    return `${minutes}m`;
  } else if (hours < 24) {
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
}

/**
 * Get day names from repeat days array
 */
export function getRepeatDaysText(repeatDays: number[]): string {
  if (repeatDays.length === 0) return 'One time';
  if (repeatDays.length === 7) return 'Every day';

  // Check for weekdays (Mon-Fri)
  const weekdays = [1, 2, 3, 4, 5];
  if (repeatDays.length === 5 && weekdays.every(day => repeatDays.includes(day))) {
    return 'Weekdays';
  }

  // Check for weekends (Sat-Sun)
  const weekends = [0, 6];
  if (repeatDays.length === 2 && weekends.every(day => repeatDays.includes(day))) {
    return 'Weekends';
  }

  // Show individual days
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return repeatDays
    .sort()
    .map(day => dayNames[day])
    .join(', ');
}

/**
 * Calculate snooze time
 */
export function calculateSnoozeTime(durationMinutes: number): number {
  return Date.now() + durationMinutes * 60 * 1000;
}
