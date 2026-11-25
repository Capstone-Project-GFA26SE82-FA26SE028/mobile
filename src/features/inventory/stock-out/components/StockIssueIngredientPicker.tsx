import { Pressable, Text, TextInput, View } from 'react-native';
import type { Ingredient } from '../../stock/types/types';
import { formatQuantity } from '../../stock/utils/formatQuantity';
import type { useStock } from '../../stock/hooks/useStock';

export function StockIssueIngredientPicker({
  stock,
  selectedIds,
  onSelect,
}: {
  stock: ReturnType<typeof useStock>;
  selectedIds: string[];
  onSelect: (ingredient: Ingredient) => void;
}) {
  return (
    <View className="gap-[8px] rounded-[12px] border border-[#DDE8E0] p-[12px]">
      <TextInput
        accessibilityLabel="Tìm nguyên liệu"
        className="min-h-[46px] rounded-[12px] border border-[#DDE8E0] bg-white px-[12px] py-[8px] text-[#16382E]"
        value={stock.search}
        onChangeText={stock.setSearch}
        placeholder="Tên hoặc mã nguyên liệu"
      />
      {stock.ingredients.isPending && (
        <Text className="text-[#53665B]">Đang tải nguyên liệu…</Text>
      )}
      {stock.ingredients.isError && (
        <Pressable
          accessibilityRole="button"
          onPress={() => void stock.ingredients.refetch()}
        >
          <Text className="text-[#A93532]">
            Không tải được nguyên liệu. Thử lại
          </Text>
        </Pressable>
      )}
      {stock.items
        .filter((item) => item.isActive && item.stockQuantity > 0)
        .map((ingredient) => {
          const selected = selectedIds.includes(ingredient.ingredientId);
          return (
            <Pressable
              key={ingredient.ingredientId}
              accessibilityRole="button"
              disabled={selected}
              className="min-h-[44px] justify-center border-b border-[#E5EBE7] py-[8px]"
              onPress={() => onSelect(ingredient)}
            >
              <Text className="font-medium text-[#16382E]">
                {ingredient.ingredientName}
              </Text>
              <Text className="text-[12px] text-[#53665B]">
                {selected
                  ? 'Đã chọn'
                  : `${formatQuantity(ingredient.stockQuantity)} ${ingredient.baseUnit}`}
              </Text>
            </Pressable>
          );
        })}
      {stock.ingredients.hasNextPage && (
        <Pressable
          accessibilityRole="button"
          disabled={stock.ingredients.isFetching}
          onPress={() => void stock.ingredients.fetchNextPage()}
        >
          <Text className="py-[8px] text-[#12664C]">
            {stock.ingredients.isFetchingNextPage ? 'Đang tải…' : 'Tải thêm'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
