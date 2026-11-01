import { axiosClient } from '@/api/axiosClient';
import { createOrderingService } from './orderingService';

export const orderingApi = createOrderingService(axiosClient);
