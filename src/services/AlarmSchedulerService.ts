import { NativeModules, Platform } from 'react-native';
import { Alarm } from '../models';

const { AlarmScheduler } = NativeModules;

/**
 * TypeScript bridge to native AlarmSchedulerModule
 * Provides methods to schedule, cancel, and manage alarms
 */
class AlarmSchedulerServiceClass {
  /**
   * Check if the module is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'android' && AlarmScheduler != null;
  }

  /**
   * Schedule an alarm
   */
  async scheduleAlarm(alarm: Alarm): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('AlarmScheduler module not available');
      return false;
    }

    try {
      const alarmData = {
        id: alarm.id,
        label: alarm.label,
        volume: alarm.volume,
        vibrate: alarm.vibrate,
        ringtone: alarm.ringtone,
        snoozeEnabled: alarm.snoozeEnabled,
        snoozeDuration: alarm.snoozeDuration,
        dismissChallenge: alarm.dismissChallenge,
      };

      await AlarmScheduler.scheduleAlarm(
        alarm.id,
        alarm.nextTrigger,
        alarmData
      );

      console.log(`Alarm scheduled: ${alarm.id} at ${new Date(alarm.nextTrigger)}`);
      return true;
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      return false;
    }
  }

  /**
   * Cancel an alarm
   */
  async cancelAlarm(alarmId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('AlarmScheduler module not available');
      return false;
    }

    try {
      await AlarmScheduler.cancelAlarm(alarmId);
      console.log(`Alarm cancelled: ${alarmId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling alarm:', error);
      return false;
    }
  }

  /**
   * Check if app can schedule exact alarms (Android 12+)
   */
  async canScheduleExactAlarms(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await AlarmScheduler.canScheduleExactAlarms();
    } catch (error) {
      console.error('Error checking exact alarm permission:', error);
      return false;
    }
  }

  /**
   * Request exact alarm permission (Android 12+)
   */
  async requestExactAlarmPermission(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await AlarmScheduler.requestExactAlarmPermission();
      return true;
    } catch (error) {
      console.error('Error requesting exact alarm permission:', error);
      return false;
    }
  }

  /**
   * Reschedule all alarms (called after boot or app update)
   */
  async rescheduleAllAlarms(alarms: Alarm[]): Promise<void> {
    const enabledAlarms = alarms.filter(alarm => alarm.enabled);

    for (const alarm of enabledAlarms) {
      await this.scheduleAlarm(alarm);
    }

    console.log(`Rescheduled ${enabledAlarms.length} alarms`);
  }
}

export const AlarmSchedulerService = new AlarmSchedulerServiceClass();
