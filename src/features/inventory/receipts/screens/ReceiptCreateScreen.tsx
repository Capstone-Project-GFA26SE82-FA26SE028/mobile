import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { receiptError } from '../api/receiptApi';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCreateReceipt } from '../hooks/useReceipts';
import { buildReceipt } from '../schemas/receiptSchema';
import type { ReceiptDraftLine } from '../types/types';
import { IngredientPicker } from '../components/IngredientPicker';
import { ReceiptLineEditor } from '../components/ReceiptLineEditor';

export default function ReceiptCreateScreen() {
  const router = useRouter();
  const model = useCreateReceipt();
  const [lines, setLines] = useState<ReceiptDraftLine[]>([]);
  const [note, setNote] = useState('');
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const frozen = model.create.isPending || !!model.attempt;

  async function submit() {
    if (lock.current) return;
    setError('');
    if (!model.attempt) model.create.reset();
    lock.current = true;
    try {
      const body =
        model.attempt?.body || buildReceipt(randomUUID(), lines, note);
      const receipt = await model.create.mutateAsync(body);
      if (mounted.current)
        router.replace({
          pathname: '/goods-receipt-detail',
          params: { id: receipt.goodsReceiptId },
        });
    } catch (cause) {
      if (mounted.current && cause instanceof Error) setError(cause.message);
    } finally {
      lock.current = false;
    }
  }
  return (
    <InventoryLayout
      title="Tạo phiếu nhập"
      back="/goods-receipts"
      maxWidth={760}
    >
      <KeyboardAvoidingView
        className="grow-[1] shrink-0 basis-[0px]"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="p-[18px] pt-[8px] gap-[14px] w-[100%] max-w-[760px] self-center"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View className="flex-row gap-[8px] items-center p-[12px] rounded-[12px] bg-[#EAF2EC]">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={'#236347'}
            />
            <Text className="text-[#236347] text-[12px] leading-[20px] grow-[1] shrink-0 basis-[0px]">
              Lưu nháp trước, xác nhận để tăng tồn kho.
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-[10px] mt-[4px]">
            <Text className="text-[16px] text-[#23382D] font-bold">
              Nguyên liệu
            </Text>
            <Text className="rounded-[20px] px-[10px] py-[6px] self-start bg-[#E6EEE7] text-[#236347] font-semibold text-[12px]">
              {lines.length} dòng
            </Text>
          </View>
          {model.attempt && !model.create.isPending && (
            <View className="rounded-[14px] p-[14px] bg-[#FFF2DB]">
              <Text className="text-[#86591E] text-[13px] leading-[21px]">
                Chưa xác định kết quả. Thử lại sẽ dùng đúng mã phiếu cũ, không
                tạo thêm phiếu.
              </Text>
              <Text
                selectable
                className="text-[#738078] text-[13px] leading-[20px] my-[10px]"
              >
                {model.attempt.body.goodsReceiptId}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={false || false}
                onPress={() =>
                  router.replace({
                    pathname: '/goods-receipt-detail',
                    params: { id: model.attempt!.body.goodsReceiptId },
                  })
                }
                className={`min-h-[52px] rounded-[16px] bg-[#fff] items-center justify-center p-[12px] border-[1px] border-[#CBDDD1] ${false || false ? 'opacity-[0.5]' : ''}`}
              >
                <Text className="text-[#236347] text-[14px] font-bold">
                  Kiểm tra phiếu
                </Text>
              </Pressable>
            </View>
          )}
          {lines.map((line, index) => (
            <ReceiptLineEditor
              key={line.key}
              line={line}
              index={index}
              disabled={frozen}
              onChange={(patch) =>
                setLines((current) =>
                  current.map((row) =>
                    row.key === line.key ? { ...row, ...patch } : row,
                  ),
                )
              }
              onRemove={() =>
                setLines((current) =>
                  current.filter((row) => row.key !== line.key),
                )
              }
            />
          ))}
          {!lines.length && !model.attempt && (
            <View
              className="p-[18px] rounded-[22px] bg-[#FAFCFA] border-[1px] border-[#E8EEE9] gap-[14px] items-center py-[32px] border-dashed"
              style={{ boxShadow: '0 4px 20px rgba(21,63,48,0.025)' }}
            >
              <View className="w-[56px] h-[56px] rounded-[18px] bg-[#EAF4ED] items-center justify-center">
                <Ionicons name="cube-outline" size={28} color={'#236347'} />
              </View>
              <Text className="text-[#738078] text-[13px] leading-[20px]">
                Chưa chọn nguyên liệu
              </Text>
            </View>
          )}
          {!frozen && (
            <Pressable
              accessibilityRole="button"
              disabled={lines.length >= 100 || false}
              onPress={() => setPicker(true)}
              className={`min-h-[52px] rounded-[16px] bg-[#fff] items-center justify-center p-[12px] border-[1px] border-[#CBDDD1] ${lines.length >= 100 || false ? 'opacity-[0.5]' : ''}`}
            >
              <Text className="text-[#236347] text-[14px] font-bold">
                + Thêm nguyên liệu
              </Text>
            </Pressable>
          )}
          <View
            className="p-[18px] rounded-[22px] bg-[#fff] border-[1px] border-[#E8EEE9] gap-[14px]"
            style={{ boxShadow: '0 4px 20px rgba(21,63,48,0.025)' }}
          >
            <Text className="text-[#607468] font-medium text-[12px] mb-[8px]">
              Ghi chú (không bắt buộc)
            </Text>
            <TextInput
              accessibilityLabel="Ghi chú phiếu nhập"
              value={note}
              onChangeText={setNote}
              editable={!frozen}
              multiline
              maxLength={1000}
              placeholder="Ví dụ: Nhập bổ sung buổi sáng"
              className="border-[1px] border-[#E4EBE6] bg-[#F6F9F6] p-[14px] min-h-[82px] rounded-[14px] text-[#23382D] text-[15px] align-top"
            />
          </View>
          {model.create.isError ? (
            <ErrorState message={receiptError(model.create.error)} />
          ) : (
            !!error && (
              <View
                accessibilityRole="alert"
                className="rounded-[14px] p-[14px] bg-[#FFF2DB]"
              >
                <Text className="text-[#86591E] text-[13px] leading-[21px]">
                  {error}
                </Text>
              </View>
            )
          )}
        </ScrollView>
        <View className="w-[100%] max-w-[760px] self-center px-[20px] py-[14px] gap-[8px] border-t-[1px] border-[#E4EBE6] bg-[#fff]">
          <Pressable
            accessibilityRole="button"
            disabled={
              (!model.attempt && !lines.length) || model.create.isPending
            }
            onPress={() => void submit()}
            className={`min-h-[52px] rounded-[16px] bg-[#236347] items-center justify-center p-[12px] ${(!model.attempt && !lines.length) || model.create.isPending ? 'opacity-[0.5]' : ''}`}
          >
            {model.create.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-[#fff] text-[14px] font-bold">
                {model.attempt ? 'Thử lại cùng phiếu' : 'Lưu phiếu nháp'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      {picker && (
        <IngredientPicker
          onClose={() => setPicker(false)}
          onSelect={(ingredient) => {
            setLines((current) => [
              ...current,
              {
                key: randomUUID(),
                ingredient,
                quantity: '',
                expiry: '',
                unitId: null,
                unitLabel: ingredient.baseUnit,
                factor: 1,
              },
            ]);
            setPicker(false);
            setError('');
          }}
        />
      )}
    </InventoryLayout>
  );
}
