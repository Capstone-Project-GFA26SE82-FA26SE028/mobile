import { axiosClient } from '@/api/axiosClient';
import { createReservationService } from './reservationService';

export const reservationApi = createReservationService(axiosClient);
