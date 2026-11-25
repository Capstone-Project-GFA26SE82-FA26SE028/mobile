import { useQueries, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useAppSelector } from '../../../../app/hooks';
import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { Loading } from '../../../../components/Loading/Loading';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import { getIngredient, stockError } from '../../stock/api/stockApi';
import { formatQuantity } from '../../stock/utils/formatQuantity';
import { formatStockDate } from '../../stock/utils/formatStockDate';
import { getStockIssue } from '../api/stockIssueApi';

export default function StockIssueDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const validId = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const issue = useQuery({
    queryKey: ['inventory-stock', userId, 'issue', id],
    queryFn: ({ signal }) => getStockIssue(id, signal),
    enabled: validId && !!userId,
    retry: false,
  });
  const ids = [
    ...new Set(issue.data?.allocations.map((row) => row.ingredientId)),
  ];
  const ingredients = useQueries({
    queries: ids.map((ingredientId) => ({
      queryKey: ['inventory-stock', userId, 'ingredient', ingredientId],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getIngredient(ingredientId, signal),
      enabled: !!userId,
      retry: false,
    })),
  });
  const names = new Map(
    ids.map((ingredientId, index) => [ingredientId, ingredients[index]?.data]),
  );

  return (
    <InventoryLayout
      title="Chi tiết phiếu xuất"
      back="/inventory"
      maxWidth={760}
    >
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          padding: 18,
        }}
      >
        {!validId ? (
          <ErrorState message="Mã phiếu xuất không hợp lệ." />
        ) : issue.isPending ? (
          <Loading />
        ) : issue.isError ? (
          <ErrorState
            message={stockError(issue.error)}
            busy={issue.isFetching}
            onRetry={() => void issue.refetch()}
          />
        ) : (
          <>
            <View className="mb-[14px] gap-[8px] rounded-[16px] border-[1px] border-[#DDE8E0] bg-[#fff] p-[16px]">
              <Text className="text-[18px] font-bold text-[#16382E]">
                {issue.data.reason}
              </Text>
              <Text className="text-[13px] text-[#53665B]">
                {formatStockDate(issue.data.createdAt)}
              </Text>
              <Text selectable className="text-[12px] text-[#53665B]">
                Mã phiếu {issue.data.stockIssueId}
              </Text>
              {!!issue.data.createdByRef && (
                <Text selectable className="text-[12px] text-[#53665B]">
                  Mã người lập {issue.data.createdByRef}
                </Text>
              )}
            </View>
            <Text className="mb-[10px] text-[15px] font-bold text-[#16382E]">
              Các lô đã xuất
            </Text>
            {issue.data.allocations.map((row) => {
              const ingredient = names.get(row.ingredientId);
              return (
                <View
                  key={row.stockMovementId}
                  className="mb-[8px] gap-[6px] rounded-[12px] border-[1px] border-[#DDE8E0] bg-[#fff] p-[14px]"
                >
                  <View className="flex-row items-center justify-between gap-[8px]">
                    <Text className="grow-[1] shrink-0 basis-[0px] text-[14px] font-semibold text-[#16382E]">
                      {ingredient?.ingredientName || 'Nguyên liệu'}
                    </Text>
                    <Text className="text-[14px] font-bold text-[#12664C]">
                      {formatQuantity(Math.abs(row.quantityChange))}{' '}
                      {ingredient?.baseUnit}
                    </Text>
                  </View>
                  {!ingredient && (
                    <Text selectable className="text-[12px] text-[#53665B]">
                      Mã nguyên liệu {row.ingredientId}
                    </Text>
                  )}
                  {!!row.goodsReceiptItemId && (
                    <Text selectable className="text-[12px] text-[#53665B]">
                      Mã lô {row.goodsReceiptItemId}
                    </Text>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </InventoryLayout>
  );
}
