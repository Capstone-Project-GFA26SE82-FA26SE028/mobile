import { axiosClient } from '@/api/axiosClient';
import { createNotificationService } from './notificationService';
export const notificationApi = createNotificationService(axiosClient);
