import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';
import type { Ingredient } from '../types/types';
import { formatQuantity } from '../utils/formatQuantity';
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge';

export function IngredientCard({
  ingredient,
  onPress,
}: {
  ingredient: Ingredient;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Xem ' + ingredient.ingredientName}
      onPress={onPress}
      className="bg-[#fff] rounded-[18px] p-[16px] border-[1px] border-[#E4EBE6] overflow-hidden active:bg-[#FAFCFA]"
    >
      {ingredient.isActive && ingredient.isLowStock && (
        <View className="absolute left-[0px] top-[20px] bottom-[20px] w-[3px] rounded-[2px] bg-[#DFAE61]" />
      )}
      <View className="flex-row items-center gap-[12px]">
        <View
          className={`w-[40px] h-[40px] rounded-[12px] items-center justify-center ${
            ingredient.isActive && ingredient.isLowStock
              ? 'bg-[#FFF3DF]'
              : 'bg-[#F0F5EF]'
          }`}
        >
          <Ionicons
            name="cube-outline"
            size={22}
            color={
              ingredient.isActive && ingredient.isLowStock
                ? '#A76A1B'
                : '#236347'
            }
          />
        </View>
        <View className="grow-[1] shrink-0 basis-[0px] min-w-[0px]">
          <Text
            numberOfLines={2}
            className="text-[16px] font-semibold leading-[22px] text-[#23382D]"
          >
            {ingredient.ingredientName}
          </Text>
          <Text
            numberOfLines={1}
            className="text-[#738078] text-[10px] mt-[4px]"
          >
            {ingredient.ingredientCode}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#A4B1A8" />
      </View>
      <View className="flex-row flex-wrap items-end justify-between gap-[12px] mt-[14px] pt-[12px] px-[12px] pb-[12px] rounded-[12px] bg-[#F6F8F5]">
        <View className="shrink-[1]">
          <Text className="text-[#738078] text-[11px] font-normal">
            Tồn hiện tại
          </Text>
          <Text className="text-[#153F30] text-[25px] font-bold mt-[3px]">
            {formatQuantity(ingredient.stockQuantity)}{' '}
            <Text className="text-[#738078] text-[13px] font-medium">
              {ingredient.baseUnit}
            </Text>
          </Text>
        </View>
        <View className="items-end gap-[8px]">
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
          <Text className="text-[#738078] text-[11px]">
            Tối thiểu {formatQuantity(ingredient.lowStockThreshold)}{' '}
            {ingredient.baseUnit}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
