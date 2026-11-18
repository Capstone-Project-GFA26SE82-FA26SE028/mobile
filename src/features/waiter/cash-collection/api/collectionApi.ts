import { axiosClient } from '@/api/axiosClient';
import { createCollectionService } from './collectionService';
export const collectionApi = createCollectionService(axiosClient);
