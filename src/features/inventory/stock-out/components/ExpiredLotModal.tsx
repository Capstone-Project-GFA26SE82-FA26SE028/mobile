import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { stockError } from '../../stock/api/stockApi';
import type { Ingredient, StockLot } from '../../stock/types/types';
import { formatQuantity } from '../../stock/utils/formatQuantity';
import { formatStockDate } from '../../stock/utils/formatStockDate';
import { useStockIssue } from '../hooks/useStockIssue';

export function ExpiredLotModal({ ingredient, lot, onClose, onSuccess }: {
  ingredient: Ingredient;
  lot: StockLot;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const { issue, uncertain } = useStockIssue();
  const locked = issue.isPending || uncertain;

  function submit() {
    if (submitting.current) return;
    const amount = Number(quantity.trim().replace(',', '.'));
    const explanation = reason.trim();
    if (!uncertain) {
      if (!/^\d+(?:[.,]\d{1,6})?$/.test(quantity.trim()) ||
          amount <= 0 || amount > 999999999999.999999 || amount > lot.remainingQuantity) {
        setError('Nhập số lượng lớn hơn 0, không vượt số còn lại và tối đa 6 chữ số thập phân.');
        return;
      }
      if (!explanation || /[\u0000-\u001F\u007F]/.test(explanation)) {
        setError('Nhập lý do hủy trên một dòng.');
        return;
      }
    }
    setError('');
    submitting.current = true;
    issue.mutate({
      reason: explanation,
      items: [{
        ingredientId: ingredient.ingredientId,
        goodsReceiptItemId: lot.goodsReceiptItemId,
        quantity: amount,
        isDisposal: true,
      }],
    }, {
      onSuccess,
      onSettled: () => { submitting.current = false; },
    });
  }

  function close() {
    if (!locked && !submitting.current) onClose();
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={close}>
      <View className="flex-1 justify-center bg-black/40 p-[18px]">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="max-h-[85%] w-full max-w-[440px] self-center rounded-[22px] bg-white"
          contentContainerClassName="gap-[14px] p-[20px]"
        >
          <Text accessibilityRole="header" className="text-[20px] font-bold text-[#23382D]">Hủy lô hết hạn</Text>
          <View className="gap-[5px] rounded-[12px] bg-[#FFF0ED] p-[12px]">
            <Text className="font-semibold text-[#23382D]">{ingredient.ingredientName}</Text>
            <Text className="text-[#A93532]">
              Hết hạn {formatStockDate(lot.expiryDate, true)} · Còn {formatQuantity(lot.remainingQuantity)} {ingredient.baseUnit}
            </Text>
          </View>
          <Text className="font-medium text-[#23382D]">Số lượng hủy ({ingredient.baseUnit})</Text>
          <TextInput
            accessibilityLabel="Số lượng hủy"
            editable={!locked}
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Nhập số lượng"
            maxLength={20}
            className="min-h-[46px] rounded-[12px] border border-[#DDE8E0] px-[12px] text-[#23382D]"
          />
          <Text className="font-medium text-[#23382D]">Lý do hủy</Text>
          <TextInput
            accessibilityLabel="Lý do hủy"
            editable={!locked}
            maxLength={1000}
            value={reason}
            onChangeText={setReason}
            placeholder="Nhập lý do"
            className="min-h-[46px] rounded-[12px] border border-[#DDE8E0] px-[12px] text-[#23382D]"
          />
          {(error || issue.isError) && (
            <Text accessibilityRole="alert" className="text-[#A93532]">
              {error || (uncertain ? 'Chưa xác nhận được kết quả. Thử lại để kiểm tra cùng phiếu.' : stockError(issue.error))}
            </Text>
          )}
          <View className="flex-row justify-end gap-[8px]">
            <Pressable accessibilityRole="button" disabled={locked} onPress={close} className="min-h-[44px] justify-center px-[12px] disabled:opacity-50">
              <Text className="font-semibold text-[#53665B]">Quay lại</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={issue.isPending} onPress={submit} className="min-h-[44px] justify-center rounded-[12px] bg-[#A93532] px-[14px]">
              <Text className="font-semibold text-white">
                {issue.isPending ? 'Đang xử lý…' : uncertain ? 'Thử lại cùng phiếu' : 'Xác nhận hủy'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
