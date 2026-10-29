import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { receiptError } from '../api/receiptApi';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import {
  StyleSheet,
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
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={r.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={r.info}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={'#236347'}
            />
            <Text
              style={[r.muted, { flex: 1, fontSize: 12, color: '#236347' }]}
            >
              Lưu nháp trước, xác nhận để tăng tồn kho.
            </Text>
          </View>
          <View style={[r.row, { marginTop: 4 }]}>
            <Text style={r.heading}>Nguyên liệu</Text>
            <Text
              style={[
                r.badge,
                {
                  backgroundColor: '#E6EEE7',
                  color: '#236347',
                  fontWeight: '600',
                  fontSize: 12,
                },
              ]}
            >
              {lines.length} dòng
            </Text>
          </View>
          {model.attempt && !model.create.isPending && (
            <View style={r.error}>
              <Text style={r.errorText}>
                Chưa xác định kết quả. Thử lại sẽ dùng đúng mã phiếu cũ, không
                tạo thêm phiếu.
              </Text>
              <Text selectable style={[r.muted, { marginVertical: 10 }]}>
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
                style={[
                  r.button,
                  r.secondaryButton,
                  (false || false) && { opacity: 0.5 },
                ]}
              >
                <Text style={[r.buttonText, { color: '#236347' }]}>
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
              style={[
                r.card,
                {
                  alignItems: 'center',
                  paddingVertical: 32,
                  borderStyle: 'dashed',
                  backgroundColor: '#FAFCFA',
                },
              ]}
            >
              <View
                style={[r.mark, { width: 56, height: 56, borderRadius: 18 }]}
              >
                <Ionicons name="cube-outline" size={28} color={'#236347'} />
              </View>
              <Text style={r.muted}>Chưa chọn nguyên liệu</Text>
            </View>
          )}
          {!frozen && (
            <Pressable
              accessibilityRole="button"
              disabled={lines.length >= 100 || false}
              onPress={() => setPicker(true)}
              style={[
                r.button,
                r.secondaryButton,
                (lines.length >= 100 || false) && { opacity: 0.5 },
              ]}
            >
              <Text style={[r.buttonText, { color: '#236347' }]}>
                + Thêm nguyên liệu
              </Text>
            </Pressable>
          )}
          <View style={r.card}>
            <Text style={r.label}>Ghi chú (không bắt buộc)</Text>
            <TextInput
              accessibilityLabel="Ghi chú phiếu nhập"
              value={note}
              onChangeText={setNote}
              editable={!frozen}
              multiline
              maxLength={1000}
              placeholder="Ví dụ: Nhập bổ sung buổi sáng"
              style={[r.input, { minHeight: 82, textAlignVertical: 'top' }]}
            />
          </View>
          {model.create.isError ? (
            <ErrorState message={receiptError(model.create.error)} />
          ) : (
            !!error && (
              <View accessibilityRole="alert" style={r.error}>
                <Text style={r.errorText}>{error}</Text>
              </View>
            )
          )}
        </ScrollView>
        <View style={r.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={
              (!model.attempt && !lines.length) || model.create.isPending
            }
            onPress={() => void submit()}
            style={[
              r.button,
              ((!model.attempt && !lines.length) || model.create.isPending) && {
                opacity: 0.5,
              },
            ]}
          >
            {model.create.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[r.buttonText]}>
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

const r = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#236347',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBDDD1',
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  content: {
    padding: 18,
    paddingTop: 8,
    gap: 14,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  mark: {
    width: 42,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF4ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8EEE9',
    gap: 14,
    boxShadow: '0 4px 20px rgba(21,63,48,0.025)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  label: { color: '#607468', fontWeight: '500', fontSize: 12, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E4EBE6',
    backgroundColor: '#F6F9F6',
    padding: 14,
    minHeight: 50,
    borderRadius: 14,
    color: '#23382D',
    fontSize: 15,
  },
  muted: { color: '#738078', fontSize: 13, lineHeight: 20 },
  heading: { fontSize: 16, color: '#23382D', fontWeight: '700' },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  error: { borderRadius: 14, padding: 14, backgroundColor: '#FFF2DB' },
  errorText: { color: '#86591E', fontSize: 13, lineHeight: 21 },
  footer: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
    borderTopWidth: 1,
    borderColor: '#E4EBE6',
    backgroundColor: '#fff',
  },
  info: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EAF2EC',
  },
});
