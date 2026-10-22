import { axiosClient } from '@/api/axiosClient';
import { createWaiterService } from './waiterService';

export const waiterService = createWaiterService(axiosClient);
