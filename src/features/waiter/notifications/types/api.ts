export type WaiterNotification = {
  id: string;
  restaurantId: string;
  type: string;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  readAt: string | null;
};
export type NotificationDetails = {
  notification: WaiterNotification;
  recipients: { userId: string; fullName: string; readAt: string | null }[];
};
export type NotificationQuery = {
  type?: string;
  isRead?: boolean;
  entityId?: string;
  from?: string;
  to?: string;
};
export type NotificationState = {
  initialized: boolean;
  knownIds: Record<string, true>;
  soundEnabled: boolean;
  soundCue: number;
  soundError: string | null;
};
