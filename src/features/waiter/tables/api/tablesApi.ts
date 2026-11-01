import { axiosClient } from '@/api/axiosClient';
import { createTableService } from './tablesService';

export const tablesApi = createTableService(axiosClient);
