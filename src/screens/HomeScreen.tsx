import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { HomeScreenProps } from '../navigation/types';
import {
  selectAllAlarms,
  selectNextAlarm,
  toggleAlarm,
  deleteAlarm,
} from '../store/slices/alarmsSlice';
import { selectTimeFormat } from '../store/slices/settingsSlice';
import { formatTime, formatTimeUntil, getRepeatDaysText } from '../utils/timeUtils';
import { AlarmSchedulerService } from '../services/AlarmSchedulerService';
import { PermissionService } from '../services/PermissionService';
import { Alarm } from '../models';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const dispatch = useDispatch();
  const alarms = useSelector(selectAllAlarms);
  const nextAlarm = useSelector(selectNextAlarm);
  const timeFormat = useSelector(selectTimeFormat);

  useEffect(() => {
    // Request permissions on first launch
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const permissions = await PermissionService.requestAllPermissions();
    if (!permissions.notifications) {
      Alert.alert(
        'Permission Required',
        'Notification permission is required for alarms to work properly.',
        [{ text: 'OK' }]
      );
    }
    if (!permissions.exactAlarms) {
      Alert.alert(
        'Permission Required',
        'Exact alarm permission is required for alarms to fire at the correct time. Please enable it in system settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => PermissionService.requestExactAlarmPermission(),
          },
        ]
      );
    }
  };

  const handleToggleAlarm = async (alarm: Alarm) => {
    dispatch(toggleAlarm(alarm.id));

    if (!alarm.enabled) {
      // Enabling alarm - schedule it
      const updatedAlarm = { ...alarm, enabled: true };
      await AlarmSchedulerService.scheduleAlarm(updatedAlarm);
    } else {
      // Disabling alarm - cancel it
      await AlarmSchedulerService.cancelAlarm(alarm.id);
    }
  };

  const handleDeleteAlarm = (alarmId: string) => {
    Alert.alert(
      'Delete Alarm',
      'Are you sure you want to delete this alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AlarmSchedulerService.cancelAlarm(alarmId);
            dispatch(deleteAlarm(alarmId));
          },
        },
      ]
    );
  };

  const renderAlarm = ({ item }: { item: Alarm }) => (
    <TouchableOpacity
      style={styles.alarmCard}
      onPress={() => navigation.navigate('AddEditAlarm', { alarmId: item.id })}
      onLongPress={() => handleDeleteAlarm(item.id)}
    >
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTime}>
          {formatTime(item.time.hour, item.time.minute, timeFormat)}
        </Text>
        <Text style={styles.alarmLabel}>{item.label}</Text>
        <Text style={styles.alarmRepeat}>{getRepeatDaysText(item.repeatDays)}</Text>
        {item.enabled && (
          <Text style={styles.alarmNextTrigger}>
            In {formatTimeUntil(item.nextTrigger)}
          </Text>
        )}
      </View>
      <Switch
        value={item.enabled}
        onValueChange={() => handleToggleAlarm(item)}
        trackColor={{ false: '#767577', true: '#81b0ff' }}
        thumbColor={item.enabled ? '#2196F3' : '#f4f3f4'}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {nextAlarm && (
        <View style={styles.nextAlarmBanner}>
          <Text style={styles.nextAlarmText}>
            Next alarm: {formatTime(nextAlarm.time.hour, nextAlarm.time.minute, timeFormat)}
          </Text>
          <Text style={styles.nextAlarmTime}>
            In {formatTimeUntil(nextAlarm.nextTrigger)}
          </Text>
        </View>
      )}

      <FlatList
        data={alarms}
        renderItem={renderAlarm}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No alarms set</Text>
            <Text style={styles.emptySubText}>Tap + to create your first alarm</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditAlarm', {})}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  nextAlarmBanner: {
    backgroundColor: '#2196F3',
    padding: 16,
    alignItems: 'center',
  },
  nextAlarmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextAlarmTime: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  alarmCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  alarmLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  alarmRepeat: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  alarmNextTrigger: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    color: '#999',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
