import { PermissionsAndroid, Platform } from 'react-native';
import { AlarmSchedulerService } from './AlarmSchedulerService';

/**
 * Service to handle Android permissions
 */
class PermissionServiceClass {
  /**
   * Request notification permission (Android 13+)
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'This app needs notification permission to show alarm notifications.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // Not needed for older versions
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if app can schedule exact alarms (Android 12+)
   */
  async canScheduleExactAlarms(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 31) {
        return await AlarmSchedulerService.canScheduleExactAlarms();
      }
      return true; // Always allowed on older versions
    } catch (error) {
      console.error('Error checking exact alarm permission:', error);
      return false;
    }
  }

  /**
   * Request exact alarm permission (Android 12+)
   * This opens system settings for the user to grant permission
   */
  async requestExactAlarmPermission(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      if (Platform.Version >= 31) {
        await AlarmSchedulerService.requestExactAlarmPermission();
      }
    } catch (error) {
      console.error('Error requesting exact alarm permission:', error);
    }
  }

  /**
   * Request all necessary permissions
   */
  async requestAllPermissions(): Promise<{
    notifications: boolean;
    exactAlarms: boolean;
  }> {
    const notifications = await this.requestNotificationPermission();
    const exactAlarms = await this.canScheduleExactAlarms();

    if (!exactAlarms) {
      // Open settings for user to grant permission
      await this.requestExactAlarmPermission();
    }

    return {
      notifications,
      exactAlarms,
    };
  }
}

export const PermissionService = new PermissionServiceClass();
