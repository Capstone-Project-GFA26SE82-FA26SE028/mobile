import axios from 'axios';
import { axiosClient } from '../../../../api/axiosClient';
import type {
  Ingredient,
  StockFilter,
  StockLot,
  StockMovement,
  StockPage,
} from '../types/types';

type Response<T> = { isSuccess: boolean; message?: string; result: T };
function result<T>(response: Response<T>) {
  if (!response.isSuccess)
    throw new Error(response.message || 'Không thể tải tồn kho.');
  return response.result;
}
export async function getIngredients(
  page: number,
  search: string,
  filter: StockFilter,
  signal?: AbortSignal,
) {
  const { data } = await axiosClient.get<Response<StockPage<Ingredient>>>(
    '/api/ingredients',
    {
      params: {
        page,
        pageSize: 20,
        search: search.trim() || undefined,
        isActive:
          filter === 'inactive' ? false : filter === 'low' ? true : undefined,
        lowStockOnly: filter === 'low',
      },
      signal,
    },
  );
  return result(data);
}
export async function getStockCounts(signal?: AbortSignal) {
  const [all, low] = await Promise.all([
    axiosClient.get<Response<StockPage<Ingredient>>>('/api/ingredients', {
      params: { page: 1, pageSize: 1 },
      signal,
    }),
    axiosClient.get<Response<StockPage<Ingredient>>>('/api/ingredients', {
      params: { page: 1, pageSize: 1, isActive: true, lowStockOnly: true },
      signal,
    }),
  ]);
  return { all: result(all.data).totalCount, low: result(low.data).totalCount };
}
function ingredientPath(id: string) {
  return '/api/ingredients/' + encodeURIComponent(id);
}
export async function getIngredient(id: string, signal?: AbortSignal) {
  const { data } = await axiosClient.get<Response<Ingredient>>(
    ingredientPath(id),
    { signal },
  );
  const ingredient = result(data);
  if (ingredient.ingredientId.toLowerCase() !== id.toLowerCase())
    throw new Error('Nguyên liệu trả về không khớp với trang này.');
  return ingredient;
}
export async function getStockLots(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  const { data } = await axiosClient.get<Response<StockPage<StockLot>>>(
    ingredientPath(id) + '/lots',
    { params: { page, pageSize: 20 }, signal },
  );
  const lots = result(data);
  if (
    lots.items.some(
      (lot) => lot.ingredientId.toLowerCase() !== id.toLowerCase(),
    )
  )
    throw new Error('Lô hàng trả về không thuộc nguyên liệu này.');
  return lots;
}
export async function getStockMovements(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  const { data } = await axiosClient.get<Response<StockPage<StockMovement>>>(
    ingredientPath(id) + '/stock-movements',
    { params: { page, pageSize: 20 }, signal },
  );
  const movements = result(data);
  if (
    movements.items.some(
      (movement) => movement.ingredientId.toLowerCase() !== id.toLowerCase(),
    )
  )
    throw new Error('Lịch sử trả về không thuộc nguyên liệu này.');
  return movements;
}
export function stockError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response)
      return 'Không kết nối được máy chủ. Kiểm tra kết nối và thử lại.';
    if (error.response.status === 401)
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (error.response.status === 403)
      return 'Tài khoản không có quyền truy cập kho này.';
    if (error.response.status === 404)
      return 'Nguyên liệu này không còn tồn tại.';
    if (error.response.status >= 500)
      return 'Dịch vụ kho đang gián đoạn. Vui lòng thử lại.';
    return typeof error.response.data?.message === 'string'
      ? error.response.data.message
      : 'Không thể tải tồn kho.';
  }
  return error instanceof Error ? error.message : 'Không thể tải tồn kho.';
}
