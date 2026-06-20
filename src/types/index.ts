export type ISODateString = string; // "2026-06-20"
export type ISODateTimeString = string; // "2026-06-20T07:30:00+09:00"

export interface Item {
  id: string;
  name: string;
  icon?: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface ItemSet {
  id: string;
  name: string;
  itemIds: string[];
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export type RecurrenceType = "once" | "weekly" | "daily";

export interface Recurrence {
  type: RecurrenceType;
  date?: ISODateString;
  daysOfWeek?: number[];
}

export interface NotificationConfig {
  enabled: boolean;
  time: string;
  snoozeOptions: number[];
}

export interface ScheduleEntry {
  id: string;
  recurrence: Recurrence;
  setIds: string[];
  itemIds: string[];
  notification: NotificationConfig;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface CheckSessionItemResult {
  itemId: string;
  checked: boolean;
  checkedAt?: ISODateTimeString;
}

export type CheckSessionStatus = "in_progress" | "completed" | "abandoned";

export interface CheckSession {
  id: string;
  scheduleEntryId?: string;
  targetDate: ISODateString;
  items: CheckSessionItemResult[];
  startedAt: ISODateTimeString;
  completedAt?: ISODateTimeString;
  status: CheckSessionStatus;
}

export type FontSize = "standard" | "large" | "extra-large";
export type NotificationPermissionState = "default" | "granted" | "denied";

export interface AppSettings {
  fontSize: FontSize;
  defaultSnoozeMinutes: number;
  notificationPermission: NotificationPermissionState;
  onboardingCompleted: boolean;
  homeBackgroundImage?: string;
}
