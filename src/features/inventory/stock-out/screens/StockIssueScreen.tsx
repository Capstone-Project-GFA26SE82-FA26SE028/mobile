import { StockIssueResult } from '../components/StockIssueResult';
import { StockIssueLine } from '../components/StockIssueLine';
import { StockIssueIngredientPicker } from '../components/StockIssueIngredientPicker';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import { stockError } from '../../stock/api/stockApi';
import { useStock } from '../../stock/hooks/useStock';
import type { Ingredient } from '../../stock/types/types';
import { formatQuantity } from '../../stock/utils/formatQuantity';
import { useStockIssue } from '../hooks/useStockIssue';
import { useIssueAvailability } from '../hooks/useIssueAvailability';

type IssueLine = { ingredient: Ingredient; quantity: string };

export default function StockIssueScreen() {
  const stock = useStock();
  const { issue, uncertain } = useStockIssue();
  const [lines, setLines] = useState<IssueLine[]>([]);
  const [reason, setReason] = useState('');
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState('');
  const locked = issue.isPending || uncertain;
  const availability = useIssueAvailability(
    lines.map(({ ingredient }) => ingredient.ingredientId),
    !issue.data && !locked,
  );

  function submit() {
    const items = lines.map(({ ingredient, quantity }) => ({
      ingredientId: ingredient.ingredientId,
      quantity: Number(quantity.trim().replace(',', '.')),
    }));
    if (!uncertain) {
      if (!reason.trim() || /[\u0000-\u001F\u007F]/.test(reason.trim())) {
        setError('Nhập lý do xuất kho trên một dòng.');
        return;
      }
      if (!items.length) {
        setError('Chọn ít nhất một nguyên liệu.');
        return;
      }
      if (availability.some((query) => !query.isSuccess)) {
        setError('Cần tải số lượng có thể xuất trước khi xác nhận.');
        return;
      }
      const invalid = lines.find(
        ({ quantity }, index) =>
          !/^\d+(?:[.,]\d{1,6})?$/.test(quantity.trim()) ||
          items[index]!.quantity <= 0 ||
          items[index]!.quantity > 999999999999.999999,
      );
      if (invalid) {
        setError(
          `Kiểm tra số lượng xuất của ${invalid.ingredient.ingredientName}. Số lượng phải lớn hơn 0 và có tối đa 6 chữ số thập phân.`,
        );
        return;
      }
      const exceeded = items.findIndex(
        (item, index) => item.quantity > availability[index]!.data!.available,
      );
      if (exceeded >= 0) {
        const { ingredient } = lines[exceeded]!;
        setError(
          `${ingredient.ingredientName} chỉ có thể xuất ${formatQuantity(availability[exceeded]!.data!.available)} ${ingredient.baseUnit}.`,
        );
        return;
      }
    }
    setError('');
    setPicking(false);
    issue.mutate({ reason: reason.trim(), items });
  }

  return (
    <InventoryLayout
      title="Xuất kho"
      subtitle="Xuất nguyên liệu theo đơn vị cơ sở"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          width: '100%',
          maxWidth: 760,
          alignSelf: 'center',
          paddingHorizontal: 18,
          paddingTop: 8,
          paddingBottom: 28,
        }}
      >
        {issue.data ? (
          <StockIssueResult
            receipt={issue.data}
            ingredients={lines.map(({ ingredient }) => ingredient)}
            onNew={() => {
              issue.reset();
              setLines([]);
              setReason('');
            }}
          />
        ) : (
          <View className="gap-[12px] rounded-[16px] bg-white p-[16px]">
            <Text className="font-semibold text-[#16382E]">Lý do xuất kho</Text>
            <TextInput
              accessibilityLabel="Lý do xuất kho"
              className="min-h-[46px] rounded-[12px] border-[1px] border-[#DDE8E0] bg-white px-[12px] py-[8px] text-[#16382E]"
              editable={!locked}
              maxLength={1000}
              value={reason}
              onChangeText={setReason}
              placeholder="Nhập lý do"
            />
            <Text className="font-semibold text-[#16382E]">Nguyên liệu</Text>
            {lines.map(({ ingredient, quantity }, index) => (
              <StockIssueLine
                key={ingredient.ingredientId}
                ingredient={ingredient}
                quantity={quantity}
                availability={availability[index]}
                locked={locked}
                onRemove={() =>
                  setLines((current) =>
                    current.filter(
                      (line) =>
                        line.ingredient.ingredientId !==
                        ingredient.ingredientId,
                    ),
                  )
                }
                onQuantityChange={(value) =>
                  setLines((current) =>
                    current.map((line) =>
                      line.ingredient.ingredientId === ingredient.ingredientId
                        ? { ...line, quantity: value }
                        : line,
                    ),
                  )
                }
              />
            ))}
            {!locked && lines.length < 100 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setPicking((value) => !value)}
                className="min-h-[44px] justify-center self-start"
              >
                <Text className="font-semibold text-[#12664C]">
                  {picking ? 'Đóng danh sách' : '+ Chọn nguyên liệu'}
                </Text>
              </Pressable>
            )}
            {picking && !locked && (
              <StockIssueIngredientPicker
                stock={stock}
                selectedIds={lines.map(
                  ({ ingredient }) => ingredient.ingredientId,
                )}
                onSelect={(ingredient) => {
                  setLines((current) =>
                    current.some(
                      (line) =>
                        line.ingredient.ingredientId ===
                        ingredient.ingredientId,
                    )
                      ? current
                      : [...current, { ingredient, quantity: '' }],
                  );
                  setPicking(false);
                }}
              />
            )}
            {(error || issue.isError) && (
              <Text
                accessibilityRole="alert"
                className="text-[14px] text-[#A93532]"
              >
                {error ||
                  (uncertain
                    ? 'Chưa xác nhận được kết quả. Thử lại để kiểm tra cùng phiếu.'
                    : stockError(issue.error))}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              disabled={issue.isPending}
              onPress={submit}
              className="min-h-[48px] items-center justify-center rounded-[12px] bg-[#12664C] px-[16px] disabled:opacity-[0.5]"
            >
              <Text className="font-bold text-white">
                {issue.isPending
                  ? 'Đang xuất kho…'
                  : uncertain
                    ? 'Thử lại cùng phiếu'
                    : 'Xác nhận xuất kho'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </InventoryLayout>
  );
}
