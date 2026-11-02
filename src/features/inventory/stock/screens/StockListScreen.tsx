import { stockError } from '../api/stockApi';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import { useStock } from '../hooks/useStock';
import { IngredientCard } from '../components/IngredientCard';
import { LoadMoreButton } from '../../../../components/LoadMoreButton/LoadMoreButton';
import { formatQuantity } from '../utils/formatQuantity';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { Loading } from '../../../../components/Loading/Loading';
import type { StockFilter } from '../types/types';

const filters: { key: StockFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'low', label: 'Sắp hết' },
  { key: 'inactive', label: 'Ngừng dùng' },
];

export default function StockListScreen() {
  const model = useStock();
  const router = useRouter();
  const wide = useWindowDimensions().width >= 768;
  const { ingredients, counts } = model;
  return (
    <InventoryLayout>
      <FlatList
        key={wide ? 'wide' : 'phone'}
        numColumns={wide ? 2 : 1}
        data={model.items}
        keyExtractor={(item) => item.ingredientId}
        contentContainerClassName="w-[100%] max-w-[1000px] self-center px-[20px] pt-[4px] pb-[28px]"
        columnWrapperStyle={wide ? { gap: 12 } : undefined}
        ItemSeparatorComponent={() => <View className="h-[12px]" />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={ingredients.isRefetching && !ingredients.isFetchingNextPage}
        onRefresh={() => void model.refresh()}
        renderItem={({ item }) => (
          <View className="grow-[1] shrink-0 basis-[0px]">
            <IngredientCard
              ingredient={item}
              onPress={() =>
                router.push({
                  pathname: '/inventory-detail',
                  params: { id: item.ingredientId },
                })
              }
            />
          </View>
        )}
        ListHeaderComponent={
          <>
            <View className="bg-[#153F30] rounded-[22px] p-[20px] mb-[18px] overflow-hidden">
              <View
                pointerEvents="none"
                className="absolute w-[200px] h-[200px] rounded-[100px] right-[-80px] top-[-100px] bg-[rgba(184,223,141,0.07)]"
              />
              <View className="flex-row items-center justify-between gap-[8px]">
                <View className="grow-[1] shrink-0 basis-[0px] min-w-[0px]">
                  <Text className="text-[#AAC5B2] text-[9px] tracking-[1.5px] font-semibold">
                    KHO NGUYÊN LIỆU
                  </Text>
                  <Text className="text-[#fff] text-[26px] font-bold mt-[5px] tracking-[-0.5px]">
                    Tổng quan tồn kho
                  </Text>
                </View>
                <View className="w-[44px] h-[44px] items-center justify-center rounded-[14px] bg-[rgba(255,255,255,0.07)]">
                  <Ionicons name="layers-outline" size={24} color="#C6DBBF" />
                </View>
              </View>
              <View className="flex-row mt-[20px] border-t-[1px] border-[rgba(255,255,255,0.12)] pt-[16px]">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xem tất cả nguyên liệu"
                  onPress={() => {
                    model.setSearch('');
                    model.setFilter('all');
                  }}
                  className="grow-[1] shrink-0 basis-[0px]"
                >
                  <Text className="text-[#fff] text-[28px] font-bold">
                    {counts.data && !counts.isError
                      ? formatQuantity(counts.data.all)
                      : '—'}
                  </Text>
                  <Text className="text-[#CBDBCF] text-[11px] mt-[4px]">
                    Tổng nguyên liệu
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xem nguyên liệu sắp hết"
                  onPress={() => {
                    model.setSearch('');
                    model.setFilter('low');
                  }}
                  className="grow-[1] shrink-0 basis-[0px] border-l-[1px] border-[rgba(255,255,255,0.12)] pl-[20px]"
                >
                  <View className="flex-row gap-[8px] items-center">
                    <Text className="text-[#F4D69A] text-[28px] font-bold">
                      {counts.data && !counts.isError
                        ? formatQuantity(counts.data.low)
                        : '—'}
                    </Text>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#F4D69A"
                    />
                  </View>
                  <Text className="text-[#CBDBCF] text-[11px] mt-[4px]">
                    Sắp hết
                  </Text>
                </Pressable>
              </View>
            </View>
            {counts.isError && (
              <ErrorState
                message={stockError(counts.error)}
                busy={counts.isFetching}
                onRetry={() => void counts.refetch()}
              />
            )}
            <View className="min-h-[48px] bg-[#fff] border-[1px] border-[#E4EBE6] rounded-[14px] flex-row items-center pl-[14px]">
              <Ionicons name="search-outline" size={20} color="#8C9B90" />
              <TextInput
                accessibilityLabel="Tìm nguyên liệu"
                placeholder="Tìm tên hoặc mã nguyên liệu…"
                placeholderTextColor="#8C9B90"
                value={model.search}
                onChangeText={model.setSearch}
                maxLength={255}
                autoCorrect={false}
                className="grow-[1] shrink-0 basis-[0px] min-w-[0px] min-h-[48px] px-[10px] text-[14px] text-[#23382D]"
                returnKeyType="search"
              />
              {!!model.search && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xóa tìm kiếm"
                  onPress={() => model.setSearch('')}
                  className="p-[12px]"
                >
                  <Ionicons name="close-circle" size={18} color="#8C9B90" />
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-[4px] mt-[12px] mb-[14px] p-[4px] rounded-[14px] bg-[#E8EEE9]">
              {filters.map((filter) => (
                <Pressable
                  key={filter.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter.key === model.filter }}
                  onPress={() => model.setFilter(filter.key)}
                  className={`grow-[1] shrink-0 basis-[0px] items-center min-h-[38px] justify-center px-[8px] rounded-[10px] ${filter.key === model.filter ? 'bg-[#236347]' : ''}`}
                >
                  <Text
                    className={`text-[12px] font-semibold ${filter.key === model.filter ? 'text-[#fff]' : 'text-[#738078]'}`}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row items-center justify-between mb-[12px]">
              <Text className="text-[#23382D] text-[16px] font-bold">
                Nguyên liệu{' '}
                <Text className="font-normal text-[#738078] text-[13px]">
                  {model.total === undefined
                    ? ''
                    : '(' + formatQuantity(model.total) + ')'}
                </Text>
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tải lại tồn kho"
                disabled={ingredients.isFetching || counts.isFetching}
                onPress={() => void model.refresh()}
                className="flex-row items-center gap-[5px] min-h-[40px] pl-[12px]"
              >
                <Ionicons name="refresh-outline" size={17} color={'#236347'} />
                <Text className="text-[12px] text-[#236347]">Tải lại</Text>
              </Pressable>
            </View>
            {ingredients.isError && (
              <ErrorState
                message={stockError(ingredients.error)}
                stale={model.items.length > 0}
                busy={ingredients.isFetching}
                onRetry={() => void ingredients.refetch()}
              />
            )}
          </>
        }
        ListEmptyComponent={
          ingredients.isPending ? (
            <Loading />
          ) : ingredients.isSuccess ? (
            <EmptyState
              title={
                model.search.trim()
                  ? 'Không tìm thấy nguyên liệu phù hợp'
                  : model.filter === 'low'
                    ? 'Không có nguyên liệu sắp hết'
                    : 'Chưa có nguyên liệu'
              }
            >
              {model.search.trim()
                ? 'Thử tìm bằng tên hoặc mã nguyên liệu khác.'
                : model.filter === 'low'
                  ? 'Các nguyên liệu đang dùng đều có tồn kho trên mức tối thiểu.'
                  : 'Nguyên liệu do quản lý thêm sẽ hiển thị tại đây.'}
            </EmptyState>
          ) : null
        }
        ListFooterComponent={
          ingredients.hasNextPage ? (
            <LoadMoreButton
              busy={ingredients.isFetching}
              onPress={() => void ingredients.fetchNextPage()}
            />
          ) : null
        }
      />
    </InventoryLayout>
  );
}
