package com.smartalarmclock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * BroadcastReceiver that is triggered when device finishes booting.
 * This sends a broadcast to the React Native app to reschedule all alarms.
 */
public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Boot completed, sending broadcast to reschedule alarms");

            // Send broadcast to React Native app
            Intent rescheduleIntent = new Intent("com.smartalarmclock.BOOT_COMPLETED");
            context.sendBroadcast(rescheduleIntent);

            // Note: The React Native app will need to handle this broadcast
            // and reschedule all enabled alarms from AsyncStorage
        }
    }
}
