package com.smartalarmclock;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import org.json.JSONException;
import org.json.JSONObject;

/**
 * Native module to schedule exact alarms using Android AlarmManager API.
 * This is critical for alarms to fire reliably when app is closed.
 */
public class AlarmSchedulerModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "AlarmScheduler";

    public AlarmSchedulerModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Schedule an exact alarm
     * @param alarmId Unique identifier for the alarm
     * @param triggerTime Timestamp when alarm should fire (milliseconds)
     * @param alarmData Alarm data as JSON
     * @param promise Promise to resolve/reject
     */
    @ReactMethod
    public void scheduleAlarm(String alarmId, double triggerTime, ReadableMap alarmData, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            if (alarmManager == null) {
                promise.reject("ERROR", "AlarmManager not available");
                return;
            }

            // Create intent for AlarmReceiver
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra("alarmId", alarmId);
            intent.putExtra("alarmData", convertMapToJson(alarmData));
            intent.setAction("com.smartalarmclock.ALARM_TRIGGER_" + alarmId);

            // Create PendingIntent
            int requestCode = alarmId.hashCode();
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

            long triggerTimeMillis = (long) triggerTime;

            // Use setAlarmClock for highest priority (shows in system UI)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(
                    triggerTimeMillis,
                    pendingIntent
                );
                alarmManager.setAlarmClock(alarmClockInfo, pendingIntent);
            } else {
                // Fallback for older Android versions
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMillis, pendingIntent);
            }

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SCHEDULE_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Cancel a scheduled alarm
     * @param alarmId Unique identifier for the alarm
     * @param promise Promise to resolve/reject
     */
    @ReactMethod
    public void cancelAlarm(String alarmId, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            if (alarmManager == null) {
                promise.reject("ERROR", "AlarmManager not available");
                return;
            }

            // Create intent matching the scheduled alarm
            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.setAction("com.smartalarmclock.ALARM_TRIGGER_" + alarmId);

            int requestCode = alarmId.hashCode();
            int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

            // Cancel the alarm
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();

            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("CANCEL_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Check if app can schedule exact alarms (Android 12+)
     * @param promise Promise to resolve/reject
     */
    @ReactMethod
    public void canScheduleExactAlarms(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Context context = getReactApplicationContext();
                AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
                if (alarmManager != null) {
                    promise.resolve(alarmManager.canScheduleExactAlarms());
                } else {
                    promise.resolve(false);
                }
            } else {
                // Always true for older Android versions
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("CHECK_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Request exact alarm permission (Android 12+)
     * Opens system settings for user to grant permission
     * @param promise Promise to resolve/reject
     */
    @ReactMethod
    public void requestExactAlarmPermission(Promise promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getReactApplicationContext().startActivity(intent);
                promise.resolve(true);
            } else {
                // Not needed for older versions
                promise.resolve(true);
            }
        } catch (Exception e) {
            promise.reject("PERMISSION_ERROR", e.getMessage(), e);
        }
    }

    /**
     * Convert ReadableMap to JSON string
     */
    private String convertMapToJson(ReadableMap map) {
        try {
            JSONObject json = new JSONObject();
            if (map.hasKey("id")) json.put("id", map.getString("id"));
            if (map.hasKey("label")) json.put("label", map.getString("label"));
            if (map.hasKey("volume")) json.put("volume", map.getInt("volume"));
            if (map.hasKey("vibrate")) json.put("vibrate", map.getBoolean("vibrate"));
            if (map.hasKey("ringtone")) json.put("ringtone", map.getString("ringtone"));
            if (map.hasKey("snoozeEnabled")) json.put("snoozeEnabled", map.getBoolean("snoozeEnabled"));
            if (map.hasKey("snoozeDuration")) json.put("snoozeDuration", map.getInt("snoozeDuration"));
            if (map.hasKey("dismissChallenge")) json.put("dismissChallenge", map.getString("dismissChallenge"));
            return json.toString();
        } catch (JSONException e) {
            return "{}";
        }
    }
}
