import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AddEditAlarmScreenProps } from '../navigation/types';
import {
  addAlarm,
  updateAlarm,
  selectAlarmById,
} from '../store/slices/alarmsSlice';
import { selectSettings } from '../store/slices/settingsSlice';
import { Alarm, defaultAlarm } from '../models';
import { calculateNextTrigger } from '../utils/timeUtils';
import { AlarmSchedulerService } from '../services/AlarmSchedulerService';
import { DAYS_OF_WEEK } from '../utils/constants';

export function AddEditAlarmScreen({ route, navigation }: AddEditAlarmScreenProps) {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const existingAlarm = useSelector((state) =>
    route.params?.alarmId
      ? selectAlarmById(state, route.params.alarmId)
      : null
  );

  const [time, setTime] = useState(
    existingAlarm
      ? new Date(0, 0, 0, existingAlarm.time.hour, existingAlarm.time.minute)
      : new Date()
  );
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [label, setLabel] = useState(existingAlarm?.label || 'Alarm');
  const [repeatDays, setRepeatDays] = useState<number[]>(existingAlarm?.repeatDays || []);
  const [enabled, setEnabled] = useState(existingAlarm?.enabled ?? true);
  const [volume, setVolume] = useState(existingAlarm?.volume || settings.defaultVolume);
  const [vibrate, setVibrate] = useState(existingAlarm?.vibrate ?? true);
  const [snoozeEnabled, setSnoozeEnabled] = useState(existingAlarm?.snoozeEnabled ?? true);
  const [snoozeDuration, setSnoozeDuration] = useState(
    existingAlarm?.snoozeDuration || settings.defaultSnooze
  );

  const isEditMode = !!existingAlarm;

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const toggleRepeatDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSave = async () => {
    const alarm: Alarm = {
      id: existingAlarm?.id || `alarm_${Date.now()}`,
      time: {
        hour: time.getHours(),
        minute: time.getMinutes(),
      },
      enabled,
      label,
      repeatDays,
      ringtone: existingAlarm?.ringtone || settings.defaultRingtone,
      volume,
      vibrate,
      snoozeEnabled,
      snoozeDuration,
      snoozeLimit: existingAlarm?.snoozeLimit || 3,
      gradualVolume: existingAlarm?.gradualVolume || false,
      dismissChallenge: existingAlarm?.dismissChallenge || 'none',
      challengeDifficulty: existingAlarm?.challengeDifficulty || 'medium',
      createdAt: existingAlarm?.createdAt || Date.now(),
      nextTrigger: 0, // Will be calculated below
    };

    // Calculate next trigger time
    alarm.nextTrigger = calculateNextTrigger(alarm);

    // Save to Redux
    if (isEditMode) {
      dispatch(updateAlarm(alarm));
    } else {
      dispatch(addAlarm(alarm));
    }

    // Schedule alarm if enabled
    if (enabled) {
      const success = await AlarmSchedulerService.scheduleAlarm(alarm);
      if (!success) {
        Alert.alert('Error', 'Failed to schedule alarm');
        return;
      }
    }

    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.timeText}>
            {time.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: settings.timeFormat === '12',
            })}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={time}
            mode="time"
            is24Hour={settings.timeFormat === '24'}
            display="spinner"
            onChange={handleTimeChange}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Label</Text>
        <TextInput
          style={styles.textInput}
          value={label}
          onChangeText={setLabel}
          placeholder="Alarm name"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repeat</Text>
        <View style={styles.daysContainer}>
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayButton,
                repeatDays.includes(day.value) && styles.dayButtonActive,
              ]}
              onPress={() => toggleRepeatDay(day.value)}
            >
              <Text
                style={[
                  styles.dayText,
                  repeatDays.includes(day.value) && styles.dayTextActive,
                ]}
              >
                {day.short}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {repeatDays.length === 0 && (
          <Text style={styles.helperText}>One-time alarm</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable alarm</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={enabled ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Vibrate</Text>
          <Switch
            value={vibrate}
            onValueChange={setVibrate}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={vibrate ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Snooze</Text>
          <Switch
            value={snoozeEnabled}
            onValueChange={setSnoozeEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={snoozeEnabled ? '#2196F3' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Volume: {volume}%</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>0%</Text>
          <View style={styles.slider}>
            <View style={[styles.sliderFill, { width: `${volume}%` }]} />
          </View>
          <Text style={styles.sliderLabel}>100%</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>
          {isEditMode ? 'Update Alarm' : 'Create Alarm'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  timeButton: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  timeText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
  },
  dayTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
