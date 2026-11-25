export type StaffNotification = {
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
  notification: StaffNotification;
  recipients: { userId: string; fullName: string; readAt: string | null }[];
};

export type NotificationQuery = {
  type?: string;
  isRead?: boolean;
  entityId?: string;
  from?: string;
  to?: string;
};
