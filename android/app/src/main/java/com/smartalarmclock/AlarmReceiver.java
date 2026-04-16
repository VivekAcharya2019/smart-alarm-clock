package com.smartalarmclock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

/**
 * BroadcastReceiver that is triggered when an alarm fires.
 * This starts the AlarmService (foreground service) to handle the alarm.
 */
public class AlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            Log.d(TAG, "Alarm received!");

            String alarmId = intent.getStringExtra("alarmId");
            String alarmData = intent.getStringExtra("alarmData");

            if (alarmId == null) {
                Log.e(TAG, "Alarm ID is null, cannot handle alarm");
                return;
            }

            // Create intent for AlarmService
            Intent serviceIntent = new Intent(context, AlarmService.class);
            serviceIntent.putExtra("alarmId", alarmId);
            serviceIntent.putExtra("alarmData", alarmData);
            serviceIntent.setAction("com.smartalarmclock.ALARM_RING");

            // Start foreground service (required for Android 8+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }

            Log.d(TAG, "AlarmService started for alarm: " + alarmId);
        } catch (Exception e) {
            Log.e(TAG, "Error handling alarm", e);
        }
    }
}
