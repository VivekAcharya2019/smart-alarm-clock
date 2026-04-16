import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  AddEditAlarm: { alarmId?: string };
  AlarmRinging: { alarmId: string };
  Settings: undefined;
  History: undefined;
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type AddEditAlarmScreenProps = NativeStackScreenProps<RootStackParamList, 'AddEditAlarm'>;
export type AlarmRingingScreenProps = NativeStackScreenProps<RootStackParamList, 'AlarmRinging'>;
export type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
export type HistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'History'>;
