import type { AxiosInstance } from 'axios';
import type { Envelope, PageResult } from '../types/api';

export function createWaiterTransport(
  client: Pick<AxiosInstance, 'get' | 'post'>,
) {
  async function get<T>(
    url: string,
    signal?: AbortSignal,
    params?: object,
  ): Promise<T> {
    const { data } = await client.get<Envelope<T>>(url, { signal, params });
    if (!data.isSuccess)
      throw new Error(data.message || 'Không thể tải dữ liệu.');
    return data.result;
  }
  async function post<T>(url: string, body?: object, key?: string): Promise<T> {
    const { data } = await client.post<Envelope<T>>(url, body, {
      headers: key ? { 'Idempotency-Key': key } : undefined,
    });
    if (!data.isSuccess)
      throw new Error(data.message || 'Không thể thực hiện thao tác.');
    return data.result;
  }
  async function pages<T>(url: string, signal?: AbortSignal): Promise<T[]> {
    const items: T[] = [];
    for (let page = 1; ; page++) {
      const result = await get<PageResult<T>>(url, signal, {
        page,
        pageSize: 100,
      });
      items.push(...result.items);
      if (items.length >= result.totalCount || !result.items.length)
        return items;
    }
  }
  return { get, post, pages };
}
