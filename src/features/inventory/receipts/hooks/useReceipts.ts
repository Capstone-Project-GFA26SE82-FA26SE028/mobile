import { useRef, useState } from 'react';
import axios from 'axios';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAppSelector } from '../../../../app/hooks';
import { authService } from '../../../auth/api/authApi';
import {
  confirmReceipt,
  createReceipt,
  getReceipt,
  getReceiptIngredient,
  getReceiptUnits,
  getReceipts,
  uncertainReceipt,
} from '../api/receiptApi';
import type { GoodsReceipt, ReceiptRequest } from '../types/types';

// Retain a failed attempt while navigating inside the app, so a retry reuses its ID.
const attempts = new Map<
  string,
  { body: ReceiptRequest; staffSession: string }
>();
export function useReceiptList() {
  const user = useAppSelector((s) => s.auth.user);
  const list = useInfiniteQuery({
    queryKey: ['inventory-receipts', user?.id, 'list'],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => getReceipts(pageParam, signal),
    getNextPageParam: (page) =>
      page.page * page.pageSize < page.totalCount ? page.page + 1 : undefined,
    enabled: user?.role === 'inventory',
    retry: false,
    staleTime: 0,
  });
  const items = [
    ...new Map(
      list.data?.pages
        .flatMap((p) => p.items)
        .map((r) => [r.goodsReceiptId, r]),
    ).values(),
  ];
  return { list, items };
}
export function useReceiptDetail(id: string) {
  const user = useAppSelector((s) => s.auth.user);
  const client = useQueryClient();
  const lock = useRef(false);
  const valid =
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id) &&
    !/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(id);
  const detail = useQuery({
    queryKey: ['inventory-receipts', user?.id, 'detail', id],
    queryFn: ({ signal }) => getReceipt(id, signal),
    enabled: valid && user?.role === 'inventory',
    retry: false,
    staleTime: 0,
  });
  const ids = [...new Set(detail.data?.items.map((i) => i.ingredientId) || [])];
  const ingredients = useQueries({
    queries: ids.map((ingredientId) => ({
      queryKey: ['inventory-receipts', user?.id, 'ingredient', ingredientId],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getReceiptIngredient(ingredientId, signal),
      retry: false,
      staleTime: 15000,
    })),
  });
  const names = new Map(
    ingredients.flatMap((q) =>
      q.data ? [[q.data.ingredientId, q.data] as const] : [],
    ),
  );
  const units = useQuery({
    queryKey: ['inventory-receipt-units', user?.id],
    queryFn: ({ signal }) => getReceiptUnits(signal),
    enabled: valid && !!detail.data?.items.some((item) => item.unitId),
    retry: false,
    staleTime: 60000,
  });
  const confirm = useMutation({
    retry: false,
    mutationFn: async () => {
      const identity = authService.identity();
      if (!identity || lock.current)
        throw new Error('Vui lòng chờ hoặc đăng nhập lại.');
      lock.current = true;
      try {
        return await confirmReceipt(id, identity);
      } finally {
        lock.current = false;
      }
    },
    onSuccess: async (receipt) => {
      if (user?.id && attempts.get(user.id)?.body.goodsReceiptId === id)
        attempts.delete(user.id);
      client.setQueryData(
        ['inventory-receipts', user?.id, 'detail', id],
        receipt,
      );
      await Promise.all([
        client.invalidateQueries({
          queryKey: ['inventory-receipts', user?.id, 'list'],
        }),
        client.invalidateQueries({ queryKey: ['inventory-stock', user?.id] }),
        client.invalidateQueries({
          queryKey: ['inventory-receipts', user?.id, 'ingredient'],
        }),
        client.invalidateQueries({
          queryKey: ['inventory-receipt-ingredients', user?.id],
        }),
      ]);
    },
    onError: () => {
      void detail.refetch();
    },
  });
  return { valid, detail, names, units, confirm };
}
export function useCreateReceipt() {
  const user = useAppSelector((s) => s.auth.user);
  const client = useQueryClient();
  const [attempt, setAttempt] = useState(() =>
    user?.id ? attempts.get(user.id) : undefined,
  );
  const lock = useRef(false);
  const create = useMutation({
    retry: false,
    mutationFn: async (body: ReceiptRequest) => {
      const identity = authService.identity();
      if (!identity || !user || lock.current)
        throw new Error('Vui lòng chờ hoặc đăng nhập lại.');
      const snapshot = {
        body: attempts.get(user.id)?.body || body,
        staffSession: identity,
      };
      attempts.set(user.id, snapshot);
      setAttempt(snapshot);
      lock.current = true;
      try {
        return await createReceipt(snapshot.body, snapshot.staffSession);
      } catch (error) {
        // Definitive validation rejections allow correction; uncertain results retain the exact payload.
        if (
          !uncertainReceipt(error) &&
          !(axios.isAxiosError(error) && error.response?.status === 409)
        ) {
          attempts.delete(user.id);
          setAttempt(undefined);
        }
        throw error;
      } finally {
        lock.current = false;
      }
    },
    onSuccess: async (receipt: GoodsReceipt) => {
      if (user?.id) attempts.delete(user.id);
      setAttempt(undefined);
      client.setQueryData(
        ['inventory-receipts', user?.id, 'detail', receipt.goodsReceiptId],
        receipt,
      );
      await client.invalidateQueries({
        queryKey: ['inventory-receipts', user?.id, 'list'],
      });
    },
  });
  return { create, attempt };
}
