import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { Loading } from '../../../../components/Loading/Loading';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { LoadMoreButton } from '../../../../components/LoadMoreButton/LoadMoreButton';
import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppSelector } from '../../../../app/hooks';
import { getReceiptIngredients, receiptError } from '../api/receiptApi';
import type { ReceiptIngredient } from '../types/types';

export function IngredientPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (item: ReceiptIngredient) => void;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useInfiniteQuery({
    queryKey: ['inventory-receipt-ingredients', user?.id, term],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getReceiptIngredients(pageParam, term, signal),
    getNextPageParam: (page) =>
      page.page * page.pageSize < page.totalCount ? page.page + 1 : undefined,
    retry: false,
  });
  const items = [
    ...new Map(
      query.data?.pages
        .flatMap((p) => p.items)
        .filter((i) => i.isActive)
        .map((i) => [i.ingredientId, i]),
    ).values(),
  ];
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="grow-[1] shrink-0 basis-[0px] bg-[#F5F7F5]">
        <View className="flex-row items-center gap-[12px] px-[18px] py-[18px] w-[100%] max-w-[760px] self-center">
          <Text className="text-[21px] font-bold text-[#153F30] mt-[4px] tracking-[-0.5px] grow-[1] shrink-0 basis-[0px]">
            Chọn nguyên liệu
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            onPress={onClose}
            className="w-[42px] h-[44px] items-center justify-center rounded-[14px] bg-[#fff] border-[1px] border-[#E7EDE8]"
          >
            <Ionicons name="close" size={23} color={'#23382D'} />
          </Pressable>
        </View>
        <FlatList
          data={items}
          keyExtractor={(i) => i.ingredientId}
          contentContainerClassName="p-[18px] pt-[8px] gap-[14px] w-[100%] max-w-[760px] self-center"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View className="gap-[12px]">
              <TextInput
                accessibilityLabel="Tìm nguyên liệu"
                placeholder="Tên hoặc mã nguyên liệu"
                value={search}
                onChangeText={setSearch}
                maxLength={255}
                className="border-[1px] border-[#E4EBE6] bg-[#F6F9F6] p-[14px] min-h-[50px] rounded-[14px] text-[#23382D] text-[15px]"
              />
              {query.isError && (
                <ErrorState
                  message={receiptError(query.error)}
                  onRetry={() => void query.refetch()}
                />
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(item)}
              className="p-[18px] rounded-[22px] bg-[#fff] border-[1px] border-[#E8EEE9] gap-[10px] flex-row items-center justify-between"
              style={{ boxShadow: '0 4px 20px rgba(21,63,48,0.025)' }}
            >
              <View className="grow-[1] shrink-0 basis-[0px]">
                <Text className="text-[16px] text-[#23382D] font-bold">
                  {item.ingredientName}
                </Text>
                <Text className="text-[#738078] text-[13px] leading-[20px]">
                  {item.ingredientCode} · {item.baseUnit}
                </Text>
              </View>
              <Ionicons name="add-circle-outline" size={24} color={'#236347'} />
            </Pressable>
          )}
          ListEmptyComponent={
            query.isPending ? (
              <Loading />
            ) : !query.isError ? (
              <EmptyState title="Không có nguyên liệu đang hoạt động" />
            ) : null
          }
          ListFooterComponent={
            query.hasNextPage ? (
              <LoadMoreButton
                busy={query.isFetchingNextPage}
                onPress={() => void query.fetchNextPage()}
              />
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
