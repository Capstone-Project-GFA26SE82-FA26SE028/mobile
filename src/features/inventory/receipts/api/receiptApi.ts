import axios from 'axios';
import { axiosClient } from '../../../../api/axiosClient';
import { authService } from '../../../auth/api/authApi';
import type {
  GoodsReceipt,
  ReceiptRequest,
  ReceiptUnit,
  IngredientConversion,
  ReceiptPage,
  ReceiptIngredient,
} from '../types/types';

type Envelope<T> = { isSuccess: boolean; message?: string; result: T };
function result<T>(data: Envelope<T>) {
  if (!data.isSuccess)
    throw new Error(data.message || 'Không thể xử lý phiếu nhập.');
  return data.result;
}
const path = '/api/goods-receipts';
export async function getReceipts(page: number, signal?: AbortSignal) {
  const { data } = await axiosClient.get<Envelope<ReceiptPage<GoodsReceipt>>>(
    path,
    {
      params: { page, pageSize: 20 },
      signal,
    },
  );
  return result(data);
}
export async function getReceipt(id: string, signal?: AbortSignal) {
  const { data } = await axiosClient.get<Envelope<GoodsReceipt>>(
    `${path}/${encodeURIComponent(id)}`,
    { signal },
  );
  const receipt = result(data);
  if (receipt.goodsReceiptId.toLowerCase() !== id.toLowerCase())
    throw new Error('Phiếu trả về không khớp. Vui lòng tải lại.');
  return receipt;
}
export async function createReceipt(
  body: ReceiptRequest,
  staffSession: string,
) {
  const { data } = await axiosClient.post<Envelope<GoodsReceipt>>(path, body, {
    staffSession,
  });
  if (staffSession !== authService.identity())
    throw new Error('Tài khoản đã thay đổi. Vui lòng đăng nhập lại.');
  const receipt = result(data);
  if (
    receipt.goodsReceiptId.toLowerCase() !== body.goodsReceiptId.toLowerCase()
  )
    throw new Error('Chưa xác nhận được kết quả tạo phiếu.');
  return receipt;
}
export async function confirmReceipt(id: string, staffSession: string) {
  const { data } = await axiosClient.post<Envelope<GoodsReceipt>>(
    `${path}/${encodeURIComponent(id)}/confirm`,
    undefined,
    { staffSession },
  );
  if (staffSession !== authService.identity())
    throw new Error('Tài khoản đã thay đổi. Vui lòng đăng nhập lại.');
  const receipt = result(data);
  if (
    receipt.goodsReceiptId.toLowerCase() !== id.toLowerCase() ||
    receipt.status !== 'Confirmed'
  )
    throw new Error('Chưa xác nhận được kết quả nhập kho. Hãy tải lại phiếu.');
  return receipt;
}
export async function getReceiptUnits(signal?: AbortSignal) {
  const { data } = await axiosClient.get<Envelope<ReceiptUnit[]>>(
    '/api/units',
    { signal },
  );
  return result(data);
}
export async function getReceiptIngredients(
  page: number,
  search: string,
  signal?: AbortSignal,
) {
  const { data } = await axiosClient.get<
    Envelope<ReceiptPage<ReceiptIngredient>>
  >('/api/ingredients', {
    params: {
      page,
      pageSize: 20,
      search: search.trim() || undefined,
      isActive: true,
    },
    signal,
  });
  return result(data);
}
export async function getReceiptIngredient(id: string, signal?: AbortSignal) {
  const { data } = await axiosClient.get<Envelope<ReceiptIngredient>>(
    `/api/ingredients/${encodeURIComponent(id)}`,
    { signal },
  );
  const ingredient = result(data);
  if (ingredient.ingredientId.toLowerCase() !== id.toLowerCase())
    throw new Error('Nguyên liệu trả về không khớp với phiếu nhập.');
  return ingredient;
}
export async function getIngredientConversions(
  id: string,
  signal?: AbortSignal,
) {
  const { data } = await axiosClient.get<Envelope<IngredientConversion[]>>(
    `/api/ingredients/${encodeURIComponent(id)}/units`,
    { signal },
  );
  return result(data);
}
export function receiptError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return 'Mất kết nối. Kiểm tra phiếu hoặc thử lại với cùng dữ liệu.';
    if (error.response.status === 401) return 'Phiên đăng nhập đã hết hạn.';
    if (error.response.status === 403)
      return 'Tài khoản không có quyền nhập kho.';
    if (error.response.status >= 500)
      return 'Dịch vụ kho đang gián đoạn. Vui lòng kiểm tra lại phiếu.';
    return typeof error.response.data?.message === 'string'
      ? error.response.data.message
      : 'Không thể xử lý phiếu nhập.';
  }
  return error instanceof Error ? error.message : 'Không thể xử lý phiếu nhập.';
}
export function uncertainReceipt(error: unknown) {
  return (
    !axios.isAxiosError(error) ||
    !error.response ||
    error.response.status >= 500
  );
}
