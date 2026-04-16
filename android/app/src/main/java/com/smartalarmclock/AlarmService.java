package com.smartalarmclock;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.Vibrator;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

/**
 * Foreground service that handles the alarm when it fires.
 * This service cannot be killed by the system, ensuring alarm reliability.
 */
public class AlarmService extends Service {
    private static final String TAG = "AlarmService";
    private static final String CHANNEL_ID = "alarm_service_channel";
    private static final int NOTIFICATION_ID = 1001;

    private PowerManager.WakeLock wakeLock;
    private Ringtone ringtone;
    private Vibrator vibrator;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "AlarmService created");

        // Create notification channel for Android O+
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "AlarmService started");

        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String alarmId = intent.getStringExtra("alarmId");
        String alarmDataJson = intent.getStringExtra("alarmData");

        if (alarmId == null) {
            Log.e(TAG, "Alarm ID is null");
            stopSelf();
            return START_NOT_STICKY;
        }

        try {
            // Parse alarm data
            JSONObject alarmData = new JSONObject(alarmDataJson != null ? alarmDataJson : "{}");
            String label = alarmData.optString("label", "Alarm");
            int volume = alarmData.optInt("volume", 80);
            boolean vibrate = alarmData.optBoolean("vibrate", true);

            // Acquire wake lock to keep device awake
            acquireWakeLock();

            // Start foreground service with notification
            startForeground(NOTIFICATION_ID, createNotification(label, alarmId));

            // Play ringtone
            playRingtone(volume);

            // Vibrate
            if (vibrate) {
                startVibration();
            }

            // Send broadcast to React Native to show UI
            sendAlarmBroadcast(alarmId, alarmDataJson);

            Log.d(TAG, "Alarm is now ringing: " + alarmId);
        } catch (Exception e) {
            Log.e(TAG, "Error starting alarm", e);
            stopSelf();
        }

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "AlarmService destroyed");

        // Stop ringtone
        if (ringtone != null && ringtone.isPlaying()) {
            ringtone.stop();
            ringtone = null;
        }

        // Stop vibration
        if (vibrator != null) {
            vibrator.cancel();
            vibrator = null;
        }

        // Release wake lock
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }

        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    /**
     * Acquire wake lock to keep device awake
     */
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "SmartAlarmClock:AlarmWakeLock"
            );
            wakeLock.acquire(10 * 60 * 1000L); // 10 minutes max
        }
    }

    /**
     * Play alarm ringtone
     */
    private void playRingtone(int volumePercent) {
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) {
                alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }

            ringtone = RingtoneManager.getRingtone(getApplicationContext(), alarmUri);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AudioAttributes attributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                ringtone.setAudioAttributes(attributes);
            } else {
                ringtone.setStreamType(AudioManager.STREAM_ALARM);
            }

            // Set volume
            AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (audioManager != null) {
                int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                int targetVolume = (int) (maxVolume * (volumePercent / 100.0));
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, targetVolume, 0);
            }

            ringtone.play();
        } catch (Exception e) {
            Log.e(TAG, "Error playing ringtone", e);
        }
    }

    /**
     * Start vibration
     */
    private void startVibration() {
        try {
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 500, 200, 500}; // Wait, vibrate, wait, vibrate
                vibrator.vibrate(pattern, 0); // Repeat pattern
            }
        } catch (Exception e) {
            Log.e(TAG, "Error vibrating", e);
        }
    }

    /**
     * Create notification for foreground service
     */
    private Notification createNotification(String label, String alarmId) {
        // Create intent to launch app when notification is tapped
        Intent contentIntent = new Intent(this, MainActivity.class);
        contentIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        contentIntent.putExtra("alarmId", alarmId);
        contentIntent.putExtra("action", "ALARM_RINGING");

        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, contentIntent, flags);

        // Build notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(label)
            .setContentText("Tap to dismiss or snooze")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(pendingIntent, true)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(pendingIntent);

        return builder.build();
    }

    /**
     * Create notification channel (Android O+)
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Alarm Service",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Alarm service notifications");
            channel.enableVibration(true);
            channel.setSound(null, null); // We handle sound separately

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    /**
     * Send broadcast to React Native app to show UI
     */
    private void sendAlarmBroadcast(String alarmId, String alarmData) {
        Intent broadcast = new Intent("com.smartalarmclock.ALARM_TRIGGERED");
        broadcast.putExtra("alarmId", alarmId);
        broadcast.putExtra("alarmData", alarmData);
        sendBroadcast(broadcast);
    }
}
