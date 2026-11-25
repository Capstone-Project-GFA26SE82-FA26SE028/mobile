import { Pressable, Text, View } from 'react-native';
import type { Ingredient } from '../../stock/types/types';
import { formatQuantity } from '../../stock/utils/formatQuantity';
import type { createStockIssue } from '../api/stockIssueApi';

export function StockIssueResult({
  receipt,
  ingredients,
  onNew,
}: {
  receipt: Awaited<ReturnType<typeof createStockIssue>>;
  ingredients: Ingredient[];
  onNew: () => void;
}) {
  return (
    <View className="gap-[12px] rounded-[16px] border border-[#DDE8E0] bg-white p-[16px]">
      <Text className="text-[18px] font-bold text-[#12664C]">Đã xuất kho</Text>
      <Text className="text-[14px] text-[#53665B]">{receipt.reason}</Text>
      <Text className="text-[12px] text-[#53665B]">
        {new Date(receipt.createdAt).toLocaleString('vi-VN')}
      </Text>
      {ingredients.map((ingredient) => (
        <View
          key={ingredient.ingredientId}
          className="flex-row justify-between gap-[8px] border-t border-[#E5EBE7] pt-[8px]"
        >
          <Text className="grow-[1] shrink-0 basis-[0px] font-medium text-[#16382E]">
            {ingredient.ingredientName}
          </Text>
          <Text className="font-semibold text-[#12664C]">
            {formatQuantity(
              Math.abs(
                receipt.allocations
                  .filter(
                    (row) =>
                      row.ingredientId.toLowerCase() ===
                      ingredient.ingredientId.toLowerCase(),
                  )
                  .reduce((total, row) => total + row.quantityChange, 0),
              ),
            )}{' '}
            {ingredient.baseUnit}
          </Text>
        </View>
      ))}
      <Pressable
        accessibilityRole="button"
        className="min-h-[44px] justify-center self-start"
        onPress={onNew}
      >
        <Text className="font-semibold text-[#12664C]">Lập phiếu mới</Text>
      </Pressable>
    </View>
  );
}
