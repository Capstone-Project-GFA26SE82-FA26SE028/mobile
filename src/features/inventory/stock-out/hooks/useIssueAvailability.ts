import { useQueries } from '@tanstack/react-query';
import { useAppSelector } from '../../../../app/hooks';
import { getIngredient, getStockLots } from '../../stock/api/stockApi';

async function getIssuableStock(id: string, signal: AbortSignal) {
  const ingredient = await getIngredient(id, signal);
  const lots = new Map<string, number>();
  for (let page = 1; ; page++) {
    const result = await getStockLots(id, page, signal);
    for (const lot of result.items) {
      lots.set(
        lot.goodsReceiptItemId,
        lot.remainingQuantity < 0
          ? -1
          : lot.canIssue
            ? lot.remainingQuantity
            : 0,
      );
    }
    if (result.page * result.pageSize >= result.totalCount) {
      if (lots.size >= result.totalCount) break;
      throw new Error('Chưa tải đủ danh sách lô hàng.');
    }
    if (!result.items.length) throw new Error('Chưa tải đủ danh sách lô hàng.');
  }
  const balances = [...lots.values()];
  const available =
    ingredient.isActive && balances.every((quantity) => quantity >= 0)
      ? Math.min(
          ingredient.stockQuantity,
          balances.reduce((sum, quantity) => sum + quantity, 0),
        )
      : 0;
  return {
    total: ingredient.stockQuantity,
    available: Math.max(0, Number(available.toFixed(6))),
  };
}

export function useIssueAvailability(ids: string[], enabled: boolean) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['inventory-stock', userId, 'issue-availability', id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getIssuableStock(id, signal),
      enabled: enabled && !!userId,
      retry: false,
      refetchInterval: 30_000,
    })),
  });
}
