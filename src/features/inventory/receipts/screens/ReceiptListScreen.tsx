import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge';
import { Loading } from '../../../../components/Loading/Loading';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { LoadMoreButton } from '../../../../components/LoadMoreButton/LoadMoreButton';
import { receiptError } from '../api/receiptApi';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import { useReceiptList } from '../hooks/useReceipts';
import { receiptDate } from '../utils/receiptDate';

export default function ReceiptListScreen() {
  const router = useRouter();
  const { list, items } = useReceiptList();
  return (
    <InventoryLayout>
      <FlatList
        data={items}
        keyExtractor={(item) => item.goodsReceiptId}
        contentContainerClassName="p-[18px] pt-[8px] gap-[14px] w-[100%] max-w-[760px] self-center"
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={() => void list.refetch()}
        ListHeaderComponent={
          <View className="gap-[16px]">
            <View className="rounded-[22px] bg-[#153F30] p-[22px] gap-[18px] overflow-hidden">
              <View
                pointerEvents="none"
                className="absolute w-[170px] h-[170px] rounded-[85px] right-[-70px] top-[-60px] border-[1px] border-[#FFFFFF10]"
              />
              <View className="flex-row items-center justify-between gap-[10px]">
                <View className="gap-[6px]">
                  <Text className="text-[11px] text-[#BDD2C5] font-semibold">
                    QUẢN LÝ NHẬP KHO
                  </Text>
                  <Text className="text-[26px] text-[#fff] font-bold tracking-[-0.5px]">
                    Nhận hàng vào kho
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={false || false}
                onPress={() => router.push('/goods-receipt-create')}
                className={`min-h-[52px] rounded-[16px] bg-[#fff] items-center justify-center p-[12px] border-[1px] border-[#CBDDD1] ${false || false ? 'opacity-[0.5]' : ''}`}
              >
                <Text className="text-[#236347] text-[14px] font-bold">
                  + Tạo phiếu nhập
                </Text>
              </Pressable>
            </View>
            <Text className="text-[16px] text-[#23382D] font-bold">
              Danh sách phiếu
              {list.data ? ` · ${list.data.pages[0].totalCount}` : ''}
            </Text>
            {list.isError && (
              <ErrorState
                message={receiptError(list.error)}
                onRetry={() => void list.refetch()}
              />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/goods-receipt-detail',
                params: { id: item.goodsReceiptId },
              })
            }
            className="p-[18px] rounded-[22px] bg-[#fff] border-[1px] border-[#E8EEE9] gap-[14px]"
            style={{ boxShadow: '0 4px 20px rgba(21,63,48,0.025)' }}
          >
            <View className="flex-row items-center justify-between gap-[10px]">
              <View className="flex-row items-center justify-start gap-[10px] grow-[1] shrink-0 basis-[0px]">
                <View className="w-[42px] h-[44px] rounded-[14px] bg-[#EAF4ED] items-center justify-center">
                  <Ionicons
                    name="document-text-outline"
                    size={23}
                    color={'#236347'}
                  />
                </View>
                <Text className="text-[#738078] text-[12px] leading-[20px]">
                  Phiếu nhập
                </Text>
              </View>
              <StatusBadge
                label={
                  item.status === 'Confirmed'
                    ? 'Đã nhập kho'
                    : item.status === 'Draft'
                      ? 'Bản nháp'
                      : item.status
                }
                tone={item.status === 'Confirmed' ? 'green' : 'amber'}
              />
            </View>
            <Text
              className="text-[14px] text-[#23382D] font-bold"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {item.receiptCode}
            </Text>
            <View className="h-[1px] bg-[#EFF3EF]" />
            <View className="flex-row items-center justify-between gap-[10px] flex-wrap">
              <View className="flex-row items-center gap-[5px]">
                <Ionicons name="calendar-outline" size={14} color={'#738078'} />
                <Text className="text-[#738078] text-[12px] leading-[20px]">
                  {receiptDate(item.createdAt)}
                </Text>
              </View>
              <View className="flex-row items-center gap-[5px]">
                <Text className="text-[12px] text-[#236347]">
                  {item.items.length} nguyên liệu
                </Text>
                <Ionicons name="chevron-forward" size={15} color={'#236347'} />
              </View>
            </View>
            {!!item.note && (
              <Text
                numberOfLines={1}
                className="text-[#738078] text-[13px] leading-[20px]"
              >
                {item.note}
              </Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          list.isPending ? (
            <Loading />
          ) : !list.isError ? (
            <EmptyState title="Chưa có phiếu nhập" icon="document-text-outline">
              Tạo phiếu đầu tiên khi nhận nguyên liệu.
            </EmptyState>
          ) : null
        }
        ListFooterComponent={
          list.hasNextPage ? (
            <LoadMoreButton
              busy={list.isFetchingNextPage}
              onPress={() => void list.fetchNextPage()}
            />
          ) : null
        }
      />
    </InventoryLayout>
  );
}
