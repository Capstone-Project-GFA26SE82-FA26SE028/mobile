import { Pressable, Text, TextInput, View } from 'react-native';
import type { Ingredient } from '../../stock/types/types';
import { formatQuantity } from '../../stock/utils/formatQuantity';
import type { useIssueAvailability } from '../hooks/useIssueAvailability';

export function StockIssueLine({
  ingredient,
  quantity,
  availability,
  locked,
  onRemove,
  onQuantityChange,
}: {
  ingredient: Ingredient;
  quantity: string;
  availability: ReturnType<typeof useIssueAvailability>[number] | undefined;
  locked: boolean;
  onRemove: () => void;
  onQuantityChange: (value: string) => void;
}) {
  return (
    <View className="gap-[8px] rounded-[12px] bg-[#F5F7F5] p-[12px]">
      <View className="flex-row items-center justify-between gap-[8px]">
        <Text className="grow-[1] shrink-0 basis-[0px] font-semibold text-[#16382E]">
          {ingredient.ingredientName}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Bỏ ${ingredient.ingredientName}`}
          disabled={locked}
          onPress={onRemove}
        >
          <Text className="text-[14px] text-[#A93532]">Bỏ</Text>
        </Pressable>
      </View>
      <Text className="text-[12px] text-[#53665B]">
        Tồn kho{' '}
        {formatQuantity(availability?.data?.total ?? ingredient.stockQuantity)}{' '}
        {ingredient.baseUnit}
      </Text>
      {availability?.isError ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => void availability?.refetch()}
        >
          <Text className="text-[12px] text-[#A93532]">
            Chưa tải được lượng có thể xuất. Thử lại
          </Text>
        </Pressable>
      ) : (
        <Text className="text-[12px] font-semibold text-[#12664C]">
          Có thể xuất{' '}
          {availability?.data
            ? `${formatQuantity(availability.data.available)} ${ingredient.baseUnit}`
            : '…'}
        </Text>
      )}
      <TextInput
        accessibilityLabel={`Số lượng xuất ${ingredient.ingredientName}`}
        className="min-h-[46px] rounded-[12px] border border-[#DDE8E0] bg-white px-[12px] py-[8px] text-[#16382E]"
        editable={!locked}
        keyboardType="decimal-pad"
        maxLength={19}
        value={quantity}
        placeholder={`Số lượng (${ingredient.baseUnit})`}
        onChangeText={onQuantityChange}
      />
    </View>
  );
}
