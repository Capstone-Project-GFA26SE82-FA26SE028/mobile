import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge';
import { Loading } from '../../../../components/Loading/Loading';
import { receiptError } from '../api/receiptApi';
import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useReceiptDetail } from '../hooks/useReceipts';
import { receiptDate } from '../utils/receiptDate';

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  return (
    <ReceiptDetail key={String(id)} id={typeof id === 'string' ? id : ''} />
  );
}
function ReceiptDetail({ id }: { id: string }) {
  const model = useReceiptDetail(id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const receipt = model.detail.data;
  const count = (value: number) =>
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 6 }).format(value);
  return (
    <InventoryLayout
      title="Chi tiết phiếu nhập"
      back="/goods-receipts"
      maxWidth={760}
    >
      <ScrollView contentContainerStyle={r.content}>
        {!model.valid ? (
          <View style={r.error}>
            <Text style={r.errorText}>Mã phiếu không hợp lệ.</Text>
          </View>
        ) : model.detail.isPending ? (
          <Loading />
        ) : (
          <>
            {model.detail.isError && (
              <ErrorState
                message={receiptError(model.detail.error)}
                onRetry={() => void model.detail.refetch()}
              />
            )}
            {receipt && (
              <>
                <View style={r.card}>
                  <View style={r.row}>
                    <View
                      style={[r.row, { justifyContent: 'flex-start', flex: 1 }]}
                    >
                      <View style={r.mark}>
                        <Ionicons
                          name="document-text-outline"
                          size={23}
                          color={'#236347'}
                        />
                      </View>
                      <Text style={r.heading}>Phiếu nhập kho</Text>
                    </View>
                    <StatusBadge
                      label={
                        receipt.status === 'Confirmed'
                          ? 'Đã nhập kho'
                          : receipt.status === 'Draft'
                            ? 'Bản nháp'
                            : receipt.status
                      }
                      tone={receipt.status === 'Confirmed' ? 'green' : 'amber'}
                    />
                  </View>
                  <Text
                    selectable
                    style={{ fontSize: 12, color: '#738078', lineHeight: 20 }}
                  >
                    {receipt.receiptCode}
                  </Text>
                  <View style={r.divider} />
                  <View style={r.row}>
                    <Text style={r.muted}>Ngày tạo</Text>
                    <Text style={{ color: '#23382D', fontSize: 13 }}>
                      {receiptDate(receipt.createdAt)}
                    </Text>
                  </View>
                  {!!receipt.confirmAt && (
                    <View style={r.row}>
                      <Text style={r.muted}>Đã nhập lúc</Text>
                      <Text style={{ color: '#23382D', fontSize: 13 }}>
                        {receiptDate(receipt.confirmAt)}
                      </Text>
                    </View>
                  )}
                  {!!receipt.note && (
                    <Text style={r.muted}>{receipt.note}</Text>
                  )}
                </View>
                <Text style={r.heading}>
                  Nguyên liệu · {receipt.items.length}
                </Text>
                {receipt.items.map((item, index) => {
                  const ingredient = model.names.get(item.ingredientId);
                  return (
                    <View style={r.card} key={item.goodsReceiptItemId}>
                      <View style={[r.row, { justifyContent: 'flex-start' }]}>
                        <View
                          style={[
                            r.mark,
                            { width: 32, height: 32, borderRadius: 10 },
                          ]}
                        >
                          <Text
                            style={{
                              color: '#236347',
                              fontSize: 12,
                              fontWeight: '700',
                            }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </Text>
                        </View>
                        <Text style={[r.heading, { flex: 1 }]}>
                          {ingredient?.ingredientName ||
                            `Nguyên liệu ${index + 1}`}
                        </Text>
                      </View>
                      {!ingredient && (
                        <Text selectable style={r.muted}>
                          Không tải được tên · {item.ingredientId}
                        </Text>
                      )}
                      <View
                        style={[
                          r.row,
                          {
                            backgroundColor: '#F2F7F2',
                            padding: 14,
                            borderRadius: 14,
                            flexWrap: 'wrap',
                          },
                        ]}
                      >
                        <Text style={r.muted}>Số lượng nhập kho</Text>
                        <Text
                          style={{
                            color: '#236347',
                            fontSize: 18,
                            fontWeight: '700',
                          }}
                        >
                          +{count(item.receivedQuantity)}{' '}
                          {ingredient?.baseUnit || ''}
                        </Text>
                      </View>
                      {item.unitId && (
                        <Text style={r.muted}>
                          Số lượng thực nhận: {count(item.inputQuantity)}{' '}
                          {model.units.data?.find(
                            (unit) => unit.unitId === item.unitId,
                          )?.name || '(chưa tải được đơn vị)'}
                          {' · '}Hệ số: {count(item.conversionFactorSnapshot)}
                        </Text>
                      )}
                      <View style={[r.row, { flexWrap: 'wrap' }]}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={15}
                            color={'#738078'}
                          />
                          <Text style={r.muted}>Hạn sử dụng</Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            color: '#23382D',
                            fontWeight: '600',
                          }}
                        >
                          {receiptDate(item.expiryDate, true)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
                {model.confirm.isError && (
                  <ErrorState message={receiptError(model.confirm.error)} />
                )}
                {receipt.status === 'Draft' && (
                  <>
                    <Text style={r.muted}>
                      Phiếu nháp chưa làm thay đổi tồn kho.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={
                        model.detail.isFetching ||
                        model.detail.isError ||
                        model.confirm.isPending
                      }
                      onPress={() => setConfirmOpen(true)}
                      style={[
                        r.button,
                        (model.detail.isFetching ||
                          model.detail.isError ||
                          model.confirm.isPending) && { opacity: 0.5 },
                      ]}
                    >
                      {model.confirm.isPending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={[r.buttonText]}>Xác nhận nhập kho</Text>
                      )}
                    </Pressable>
                  </>
                )}
                {receipt.status === 'Confirmed' && (
                  <View style={[r.card, { backgroundColor: '#EAF4ED' }]}>
                    <Text style={{ color: '#236347', lineHeight: 22 }}>
                      Đã cập nhật tồn kho và ghi nhận lịch sử nhập hàng.
                    </Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={model.confirm.isPending || model.detail.isFetching}
                  onPress={() => void model.detail.refetch()}
                  style={[
                    r.button,
                    r.secondaryButton,
                    (model.confirm.isPending || model.detail.isFetching) && {
                      opacity: 0.5,
                    },
                  ]}
                >
                  {model.detail.isFetching ? (
                    <ActivityIndicator color="#236347" />
                  ) : (
                    <Text style={[r.buttonText, { color: '#236347' }]}>
                      Tải lại phiếu
                    </Text>
                  )}
                </Pressable>
              </>
            )}
          </>
        )}
      </ScrollView>
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!model.confirm.isPending) setConfirmOpen(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(12,34,24,0.4)',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Pressable
            accessibilityLabel="Đóng xác nhận"
            disabled={model.confirm.isPending}
            onPress={() => setConfirmOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              r.card,
              { width: '100%', maxWidth: 420, alignSelf: 'center', gap: 18 },
            ]}
          >
            <Text style={r.heading}>Nhập kho phiếu này?</Text>
            <Text style={r.muted}>
              Tồn kho sẽ tăng theo {receipt?.items.length} dòng nguyên liệu.
              Phiếu đã xác nhận không thể chỉnh sửa trên ứng dụng.
            </Text>
            {model.confirm.isError && (
              <ErrorState message={receiptError(model.confirm.error)} />
            )}
            <Pressable
              accessibilityRole="button"
              disabled={false || model.confirm.isPending}
              onPress={() =>
                model.confirm.mutate(undefined, {
                  onSuccess: () => setConfirmOpen(false),
                  onError: () => setConfirmOpen(false),
                })
              }
              style={[
                r.button,
                (false || model.confirm.isPending) && { opacity: 0.5 },
              ]}
            >
              {model.confirm.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[r.buttonText]}>Xác nhận nhập kho</Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={model.confirm.isPending || false}
              onPress={() => setConfirmOpen(false)}
              style={[
                r.button,
                r.secondaryButton,
                (model.confirm.isPending || false) && { opacity: 0.5 },
              ]}
            >
              <Text style={[r.buttonText, { color: '#236347' }]}>Để sau</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  muted: { color: '#738078', fontSize: 13, lineHeight: 20 },
  heading: { fontSize: 16, color: '#23382D', fontWeight: '700' },
  error: { borderRadius: 14, padding: 14, backgroundColor: '#FFF2DB' },
  errorText: { color: '#86591E', fontSize: 13, lineHeight: 21 },
  divider: { height: 1, backgroundColor: '#EFF3EF' },
});
