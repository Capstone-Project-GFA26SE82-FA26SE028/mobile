import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { Loading } from '../../../../components/Loading/Loading';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { LoadMoreButton } from '../../../../components/LoadMoreButton/LoadMoreButton';
import { stockError } from '../../stock/api/stockApi';
import { useStock } from '../../stock/hooks/useStock';
import type { Ingredient } from '../../stock/types/types';
import { formatQuantity } from '../../stock/utils/formatQuantity';

export function StockIssueIngredientPicker({
  selectedIds,
  onClose,
  onSelect,
}: {
  selectedIds: string[];
  onClose: () => void;
  onSelect: (ingredient: Ingredient) => void;
}) {
  const { ingredients, items, search, setSearch } = useStock();
  const availableItems = items.filter((item) => item.isActive && item.stockQuantity > 0);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="grow-[1] shrink-0 basis-[0px] bg-[#F5F7F5]">
        <View className="w-full max-w-[760px] flex-row items-center justify-between self-center px-[18px] py-[18px]">
          <Text className="text-[21px] font-bold text-[#153F30]">Chọn nguyên liệu</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            onPress={onClose}
            className="h-[44px] w-[42px] items-center justify-center rounded-[14px] border-[1px] border-[#E7EDE8] bg-white"
          >
            <Ionicons name="close" size={23} color="#23382D" />
          </Pressable>
        </View>
        <FlatList
          data={availableItems}
          keyExtractor={(item) => item.ingredientId}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="w-full max-w-[760px] gap-[14px] self-center p-[18px] pt-[8px]"
          ListHeaderComponent={
            <View className="gap-[12px]">
              <TextInput
                accessibilityLabel="Tìm nguyên liệu"
                placeholder="Tên hoặc mã nguyên liệu"
                value={search}
                onChangeText={setSearch}
                maxLength={255}
                className="min-h-[50px] rounded-[14px] border-[1px] border-[#E4EBE6] bg-[#F6F9F6] p-[14px] text-[15px] text-[#23382D]"
              />
              {ingredients.isError && (
                <ErrorState
                  message={stockError(ingredients.error)}
                  onRetry={() => void ingredients.refetch()}
                />
              )}
            </View>
          }
          renderItem={({ item }) => {
            const selected = selectedIds.includes(item.ingredientId);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: selected, selected }}
                disabled={selected}
                onPress={() => onSelect(item)}
                className="flex-row items-center justify-between gap-[10px] rounded-[22px] border-[1px] border-[#E8EEE9] bg-white p-[18px]"
              >
                <View className="flex-1">
                  <Text className="text-[16px] font-bold text-[#23382D]">{item.ingredientName}</Text>
                  <Text className="text-[13px] leading-[20px] text-[#738078]">
                    {item.ingredientCode} · Tồn kho {formatQuantity(item.stockQuantity)} {item.baseUnit}
                  </Text>
                </View>
                {selected ? (
                  <Text className="text-[13px] text-[#738078]">Đã chọn</Text>
                ) : (
                  <Ionicons name="add-circle-outline" size={24} color="#236347" />
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            ingredients.isPending ? (
              <Loading />
            ) : !ingredients.isError && !ingredients.hasNextPage ? (
              <EmptyState title="Không tìm thấy nguyên liệu có tồn kho" />
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
      </SafeAreaView>
    </Modal>
  );
}
