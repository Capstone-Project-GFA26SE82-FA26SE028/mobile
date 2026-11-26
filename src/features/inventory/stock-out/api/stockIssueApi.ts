import { axiosClient } from '../../../../api/axiosClient';
import { authService } from '../../../auth/api/authApi';
import type { StockIssue, StockIssueRequest } from '../types/types';

type Response = { isSuccess: boolean; message?: string; result: StockIssue };

export async function getStockIssue(id: string, signal?: AbortSignal) {
  const { data } = await axiosClient.get<Response>(
    `/api/stock-issues/${encodeURIComponent(id)}`,
    { signal },
  );
  if (
    !data.isSuccess ||
    data.result?.stockIssueId?.toLowerCase() !== id.toLowerCase()
  )
    throw new Error(data.message || 'Không thể tải chi tiết phiếu xuất.');
  return data.result;
}

export async function createStockIssue(
  body: StockIssueRequest,
  staffSession: string,
) {
  const { data } = await axiosClient.post<Response>('/api/stock-issues', body, {
    staffSession,
  });
  if (staffSession !== authService.identity())
    throw new Error('Tài khoản đã thay đổi. Vui lòng đăng nhập lại.');
  if (
    !data.isSuccess ||
    data.result?.stockIssueId?.toLowerCase() !== body.stockIssueId.toLowerCase()
  )
    throw new Error(data.message || 'Chưa xác nhận được kết quả xuất kho.');
  return data.result;
}
