import { stockError } from '../api/stockApi';
import { useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, Pressable, Text, View } from 'react-native';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import { useStockDetail } from '../hooks/useStock';
import { LoadMoreButton } from '../../../../components/LoadMoreButton/LoadMoreButton';
import { formatQuantity } from '../utils/formatQuantity';
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { Loading } from '../../../../components/Loading/Loading';
import { StockLotCard, StockMovementCard } from '../components/StockDetailRows';
import type { StockLot, StockMovement } from '../types/types';

export default function StockDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <IngredientDetails key={id} id={id} />;
}
type Row =
  | { kind: 'lot'; item: StockLot }
  | { kind: 'history'; item: StockMovement };

function IngredientDetails({ id }: { id: string }) {
  const model = useStockDetail(id);
  const ingredient = model.ingredient.data;
  const active = model.tab === 'lots' ? model.lots : model.history;
  const data: Row[] =
    model.tab === 'lots'
      ? [
          ...new Map(
            model.lots.data?.pages
              .flatMap((page) => page.items)
              .map((item) => [item.goodsReceiptItemId, item]),
          ).values(),
        ].map((item) => ({ kind: 'lot', item }))
      : [
          ...new Map(
            model.history.data?.pages
              .flatMap((page) => page.items)
              .map((item) => [item.stockMovementId, item]),
          ).values(),
        ].map((item) => ({ kind: 'history', item }));
  return (
    <InventoryLayout
      title="Chi tiết nguyên liệu"
      subtitle="Tồn kho, lô hàng và lịch sử"
      back="/inventory"
    >
      {!model.validId ? (
        <View className="w-[100%] max-w-[760px] self-center px-[20px] pt-[4px] pb-[28px]">
          <EmptyState title="Nguyên liệu không hợp lệ">
            Quay lại tồn kho và chọn một nguyên liệu.
          </EmptyState>
        </View>
      ) : model.ingredient.isPending ? (
        <Loading />
      ) : !ingredient ? (
        <View className="w-[100%] max-w-[760px] self-center px-[20px] pt-[4px] pb-[28px]">
          <ErrorState
            message={stockError(model.ingredient.error)}
            busy={model.ingredient.isFetching}
            onRetry={() => void model.ingredient.refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(row) =>
            row.kind === 'lot'
              ? row.item.goodsReceiptItemId
              : row.item.stockMovementId
          }
          contentContainerClassName="w-[100%] max-w-[760px] self-center px-[20px] pt-[4px] pb-[28px]"
          ItemSeparatorComponent={() => <View className="h-[12px]" />}
          refreshing={
            model.ingredient.isRefetching ||
            (active.isRefetching && !active.isFetchingNextPage)
          }
          onRefresh={() => void model.refresh()}
          renderItem={({ item }) =>
            item.kind === 'lot' ? (
              <StockLotCard lot={item.item} unit={ingredient.baseUnit} />
            ) : (
              <StockMovementCard
                movement={item.item}
                unit={ingredient.baseUnit}
              />
            )
          }
          ListHeaderComponent={
            <>
              {model.ingredient.isError && (
                <ErrorState
                  message={stockError(model.ingredient.error)}
                  stale
                  busy={model.ingredient.isFetching}
                  onRetry={() => void model.refresh()}
                />
              )}
              <View className="bg-[#fff] rounded-[22px] p-[20px] border-[1px] border-[#E4EBE6]">
                <View className="flex-row justify-between items-center">
                  <View className="w-[46px] h-[46px] rounded-[14px] items-center justify-center bg-[#EFF5ED]">
                    <Ionicons name="cube-outline" size={27} color={'#236347'} />
                  </View>
                  <StatusBadge
                    label={
                      !ingredient.isActive
                        ? 'Ngừng dùng'
                        : ingredient.isLowStock
                          ? 'Sắp hết'
                          : 'Còn hàng'
                    }
                    tone={
                      !ingredient.isActive
                        ? 'gray'
                        : ingredient.isLowStock
                          ? 'amber'
                          : 'green'
                    }
                  />
                </View>
                <Text className="text-[#23382D] text-[24px] font-bold mt-[14px] leading-[31px]">
                  {ingredient.ingredientName}
                </Text>
                <Text
                  selectable
                  className="text-[#738078] text-[10px] mt-[7px]"
                >
                  {ingredient.ingredientCode}
                </Text>
                <View className="flex-row mt-[18px] p-[16px] bg-[#F1F6F0] rounded-[15px]">
                  <View className="grow-[1] shrink-0 basis-[0px] min-w-[0px]">
                    <Text className="text-[#738078] text-[11px]">
                      Tồn hiện tại
                    </Text>
                    <Text className="text-[#236347] text-[28px] font-bold mt-[8px]">
                      {formatQuantity(ingredient.stockQuantity)}{' '}
                      <Text className="text-[#738078] text-[12px] font-normal">
                        {ingredient.baseUnit}
                      </Text>
                    </Text>
                  </View>
                  <View className="grow-[1] shrink-0 basis-[0px] min-w-[0px] border-l-[1px] border-[#E4EBE6] pl-[18px]">
                    <Text className="text-[#738078] text-[11px]">
                      Tồn tối thiểu
                    </Text>
                    <Text className="text-[#23382D] text-[23px] font-semibold mt-[11px]">
                      {formatQuantity(ingredient.lowStockThreshold)}{' '}
                      <Text className="text-[#738078] text-[12px] font-normal">
                        {ingredient.baseUnit}
                      </Text>
                    </Text>
                  </View>
                </View>
                {ingredient.isActive && ingredient.isLowStock && (
                  <View className="bg-[#FFF5E5] flex-row items-center gap-[8px] rounded-[12px] p-[12px] mt-[14px]">
                    <Ionicons
                      name="alert-circle-outline"
                      size={17}
                      color={'#A76A1B'}
                    />
                    <Text className="grow-[1] shrink-0 basis-[0px] text-[12px] text-[#A76A1B] leading-[19px]">
                      Tồn kho đã chạm mức tối thiểu. Cần nhập bổ sung.
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-row p-[5px] bg-[#E8EEE9] rounded-[15px] mt-[18px]">
                {(['lots', 'history'] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: model.tab === tab }}
                    accessibilityLabel={tab === 'lots' ? 'Lô hàng' : 'Lịch sử'}
                    onPress={() => model.setTab(tab)}
                    className={`grow-[1] shrink-0 basis-[0px] min-h-[43px] flex-row items-center justify-center gap-[8px] rounded-[11px] ${model.tab === tab ? 'bg-[#fff]' : ''}`}
                  >
                    <Ionicons
                      name={tab === 'lots' ? 'layers-outline' : 'time-outline'}
                      size={18}
                      color={model.tab === tab ? '#236347' : '#738078'}
                    />
                    <Text
                      className={`text-[13px] font-semibold ${model.tab === tab ? 'text-[#236347]' : 'text-[#738078]'}`}
                    >
                      {tab === 'lots' ? 'Lô hàng' : 'Lịch sử'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row items-center justify-between mt-[12px] mb-[8px]">
                <Text className="text-[#23382D] text-[15px] font-bold">
                  {model.tab === 'lots'
                    ? 'Danh sách lô hàng'
                    : 'Biến động tồn kho'}{' '}
                  <Text className="text-[#738078] text-[12px] font-normal">
                    {active.data
                      ? '(' +
                        formatQuantity(active.data.pages[0].totalCount) +
                        ')'
                      : ''}
                  </Text>
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tải lại nguyên liệu"
                  disabled={active.isFetching || model.ingredient.isFetching}
                  onPress={() => void model.refresh()}
                  className="w-[42px] h-[42px] justify-center items-center"
                >
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={'#236347'}
                  />
                </Pressable>
              </View>
              {active.isError && (
                <ErrorState
                  message={stockError(active.error)}
                  stale={data.length > 0}
                  busy={active.isFetching}
                  onRetry={() => void active.refetch()}
                />
              )}
            </>
          }
          ListEmptyComponent={
            active.isPending ? (
              <Loading />
            ) : active.isSuccess ? (
              <EmptyState
                title={
                  model.tab === 'lots' ? 'Chưa có lô hàng' : 'Chưa có biến động'
                }
              >
                {model.tab === 'lots'
                  ? 'Lô hàng sẽ xuất hiện sau khi xác nhận phiếu nhập kho.'
                  : 'Các lần nhập và sử dụng nguyên liệu sẽ hiển thị tại đây.'}
              </EmptyState>
            ) : null
          }
          ListFooterComponent={
            active.hasNextPage ? (
              <LoadMoreButton
                busy={active.isFetching}
                onPress={() => void active.fetchNextPage()}
              />
            ) : null
          }
        />
      )}
    </InventoryLayout>
  );
}
