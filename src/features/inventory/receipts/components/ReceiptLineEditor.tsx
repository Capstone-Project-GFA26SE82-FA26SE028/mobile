import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppSelector } from '../../../../app/hooks';
import {
  getIngredientConversions,
  getReceiptUnits,
  receiptError,
} from '../api/receiptApi';
import type { ReceiptDraftLine } from '../types/types';
import { updateReceiptExpiry } from '../schemas/receiptSchema';

export function ReceiptLineEditor({
  line,
  index,
  disabled,
  onChange,
  onRemove,
}: {
  line: ReceiptDraftLine;
  index: number;
  disabled: boolean;
  onChange: (patch: Partial<ReceiptDraftLine>) => void;
  onRemove: () => void;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const [expanded, setExpanded] = useState(false);
  const dateInputs = useRef<(TextInput | null)[]>([]);
  const expiryParts = line.expiry.split('/');
  const units = useQuery({
    queryKey: ['inventory-receipt-units', user?.id],
    queryFn: ({ signal }) => getReceiptUnits(signal),
    enabled: expanded,
    retry: false,
    staleTime: 60000,
  });
  const conversions = useQuery({
    queryKey: [
      'inventory-receipt-conversions',
      user?.id,
      line.ingredient.ingredientId,
    ],
    queryFn: ({ signal }) =>
      getIngredientConversions(line.ingredient.ingredientId, signal),
    enabled: expanded,
    retry: false,
  });
  const options =
    conversions.data?.flatMap((item) => {
      const unit = units.data?.find((u) => u.unitId === item.unitId);
      return unit && item.conversionFactor > 0
        ? [{ id: unit.unitId, name: unit.name, factor: item.conversionFactor }]
        : [];
    }) || [];
  return (
    <View
      className="p-[18px] rounded-[22px] bg-[#fff] border-[1px] border-[#E8EEE9] gap-[14px]"
      style={{ boxShadow: '0 4px 20px rgba(21,63,48,0.025)' }}
    >
      <View className="flex-row items-center justify-between gap-[10px]">
        <View className="w-[38px] h-[38px] rounded-[12px] bg-[#EAF4ED] items-center justify-center">
          <Text className="text-[14px] text-[#236347] font-bold">
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>
        <View className="grow-[1] shrink-0 basis-[0px]">
          <Text className="text-[16px] text-[#23382D] font-bold">
            {line.ingredient.ingredientName}
          </Text>
          <Text className="text-[#738078] text-[13px] leading-[20px]">
            {line.ingredient.ingredientCode}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xóa dòng ${index + 1}`}
          disabled={disabled}
          onPress={onRemove}
          className="w-[36px] h-[40px] items-center justify-center rounded-[14px] bg-[#FFF4F2] border-[0px] border-[#E7EDE8]"
        >
          <Ionicons name="trash-outline" size={19} color={'#B44741'} />
        </Pressable>
      </View>
      <View className="h-[1px] bg-[#EFF3EF]" />
      <View className="flex-row gap-[12px]">
        <View className="grow-[1] shrink-0 basis-[0px]">
          <Text className="text-[#607468] font-medium text-[12px] mb-[8px]">
            Số lượng
          </Text>
          <TextInput
            accessibilityLabel={`Số lượng dòng ${index + 1}`}
            value={line.quantity}
            editable={!disabled}
            onChangeText={(quantity) => onChange({ quantity })}
            keyboardType="decimal-pad"
            placeholder="0"
            maxLength={20}
            className="border-[1px] border-[#E4EBE6] bg-[#F6F9F6] p-[14px] min-h-[50px] rounded-[14px] text-[#23382D] text-[15px]"
          />
        </View>
        <View className="grow-[1] shrink-0 basis-[0px]">
          <Text className="text-[#607468] font-medium text-[12px] mb-[8px]">
            Đơn vị
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Đơn vị dòng ${index + 1}`}
            disabled={disabled}
            onPress={() => setExpanded(!expanded)}
            className="border-[1px] border-[#E4EBE6] bg-[#F6F9F6] p-[14px] min-h-[50px] rounded-[14px] text-[#23382D] text-[15px] flex-row items-center justify-between gap-[10px]"
          >
            <Text className="text-[#23382D] grow-[1] shrink-0 basis-[0px]">
              {line.unitLabel}
            </Text>
            <Ionicons name="chevron-down" size={15} color={'#738078'} />
          </Pressable>
        </View>
      </View>
      {expanded && !disabled && (
        <View className="gap-[6px]">
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onChange({
                unitId: null,
                unitLabel: line.ingredient.baseUnit,
                factor: 1,
              });
              setExpanded(false);
            }}
            className="border-[1px] border-[#E4EBE6] bg-[#F6F9F6] p-[14px] min-h-[50px] rounded-[14px] text-[#23382D] text-[15px]"
          >
            <Text className="text-[#236347]">
              {line.ingredient.baseUnit} · Đơn vị gốc
            </Text>
          </Pressable>
          {(units.isPending || conversions.isPending) && (
            <Text className="text-[#738078] text-[13px] leading-[20px]">
              Đang tải đơn vị…
            </Text>
          )}
          {(units.isError || conversions.isError) && (
            <ErrorState
              message={receiptError(units.error || conversions.error)}
              onRetry={() => {
                void units.refetch();
                void conversions.refetch();
              }}
            />
          )}
          {options.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option.id}
              className="border-[1px] border-[#E4EBE6] bg-[#F6F9F6] p-[14px] min-h-[50px] rounded-[14px] text-[#23382D] text-[15px]"
              onPress={() => {
                onChange({
                  unitId: option.id,
                  unitLabel: option.name,
                  factor: option.factor,
                });
                setExpanded(false);
              }}
            >
              <Text className="text-[#23382D]">
                {option.name} = {option.factor} {line.ingredient.baseUnit}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <View>
        <Text className="text-[#607468] font-medium text-[12px] mb-[8px]">
          Hạn sử dụng
        </Text>
        <View className="border-[1px] border-[#E4EBE6] bg-[#F6F9F6] p-[14px] min-h-[50px] rounded-[14px] text-[#23382D] text-[15px] flex-row items-center py-[0px] gap-[6px]">
          {['Ngày', 'Tháng', 'Năm'].map((label, part) => (
            <View
              key={label}
              className={`flex-row items-center gap-[6px] ${part === 2 ? 'grow-[1.4] shrink-0 basis-[0px]' : 'grow-[1] shrink-0 basis-[0px]'}`}
            >
              {part > 0 && (
                <Text className="text-[#738078] text-[17px]">/</Text>
              )}
              <TextInput
                ref={(input) => {
                  dateInputs.current[part] = input;
                }}
                accessibilityLabel={`${label} hết hạn dòng ${index + 1}`}
                value={expiryParts[part] || ''}
                editable={!disabled}
                placeholder={label}
                placeholderTextColor="#8B9A90"
                keyboardType="number-pad"
                maxLength={part === 2 ? 4 : 2}
                selectTextOnFocus
                onChangeText={(value) => {
                  onChange({
                    expiry: updateReceiptExpiry(line.expiry, part, value),
                  });
                  if (part < 2 && value.replace(/\D/g, '').length === 2)
                    dateInputs.current[part + 1]?.focus();
                }}
                onKeyPress={({ nativeEvent }) => {
                  if (
                    nativeEvent.key === 'Backspace' &&
                    !expiryParts[part] &&
                    part > 0
                  )
                    dateInputs.current[part - 1]?.focus();
                }}
                className="grow-[1] shrink-0 basis-[0px] min-w-[0px] min-h-[48px] py-[12px] text-[#23382D] text-[15px] text-center"
                style={{ fontVariant: ['tabular-nums'] }}
              />
            </View>
          ))}
        </View>
      </View>
      {line.unitId && (
        <Text className="text-[#738078] text-[13px] leading-[20px]">
          1 {line.unitLabel} = {line.factor} {line.ingredient.baseUnit}
        </Text>
      )}
    </View>
  );
}
