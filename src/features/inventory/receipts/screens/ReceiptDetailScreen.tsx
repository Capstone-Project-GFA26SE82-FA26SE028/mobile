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
      <ScrollView contentContainerClassName="p-[18px] pt-[8px] gap-[14px] w-[100%] max-w-[760px] self-center">
        {!model.valid ? (
          <View className="rounded-[14px] p-[14px] bg-[#FFF2DB]">
            <Text className="text-[#86591E] text-[13px] leading-[21px]">
              Mã phiếu không hợp lệ.
            </Text>
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
                <View
                  className="p-[18px] rounded-[22px] bg-[#fff] border-[1px] border-[#E8EEE9] gap-[14px]"
                  style={{ boxShadow: '0 4px 20px rgba(21,63,48,0.025)' }}
                >
                  <View className="flex-row items-center justify-between gap-[10px]">
                    <View className="flex-row items-center justify-start gap-[10px] grow-[1] shrink-0 basis-[0px]">
                      <View className="w-[42px] h-[44px] rounded-[14px] bg-[#EAF4ED] items-center justify-center">
                        <Ionicons
                          name="document-text-outline"
                          size={23}
                          color={'#236347'}
                        />
                      </View>
                      <Text className="text-[16px] text-[#23382D] font-bold">
                        Phiếu nhập kho
                      </Text>
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
                    className="text-[12px] text-[#738078] leading-[20px]"
                  >
                    {receipt.receiptCode}
                  </Text>
                  <View className="h-[1px] bg-[#EFF3EF]" />
                  <View className="flex-row items-center justify-between gap-[10px]">
                    <Text className="text-[#738078] text-[13px] leading-[20px]">
                      Ngày tạo
                    </Text>
                    <Text className="text-[#23382D] text-[13px]">
                      {receiptDate(receipt.createdAt)}
                    </Text>
                  </View>
                  {!!receipt.confirmAt && (
                    <View className="flex-row items-center justify-between gap-[10px]">
                      <Text className="text-[#738078] text-[13px] leading-[20px]">
                        Đã nhập lúc
                      </Text>
                      <Text className="text-[#23382D] text-[13px]">
                        {receiptDate(receipt.confirmAt)}
                      </Text>
                    </View>
                  )}
                  {!!receipt.note && (
                    <Text className="text-[#738078] text-[13px] leading-[20px]">
                      {receipt.note}
                    </Text>
                  )}
                </View>
                <Text className="text-[16px] text-[#23382D] font-bold">
                  Nguyên liệu · {receipt.items.length}
                </Text>
                {receipt.items.map((item, index) => {
                  const ingredient = model.names.get(item.ingredientId);
                  return (
                    <View
                      className="p-[18px] rounded-[22px] bg-[#fff] border-[1px] border-[#E8EEE9] gap-[14px]"
                      style={{ boxShadow: '0 4px 20px rgba(21,63,48,0.025)' }}
                      key={item.goodsReceiptItemId}
                    >
                      <View className="flex-row items-center justify-start gap-[10px]">
                        <View className="w-[32px] h-[32px] rounded-[10px] bg-[#EAF4ED] items-center justify-center">
                          <Text className="text-[#236347] text-[12px] font-bold">
                            {String(index + 1).padStart(2, '0')}
                          </Text>
                        </View>
                        <Text className="text-[16px] text-[#23382D] font-bold grow-[1] shrink-0 basis-[0px]">
                          {ingredient?.ingredientName ||
                            `Nguyên liệu ${index + 1}`}
                        </Text>
                      </View>
                      {!ingredient && (
                        <Text
                          selectable
                          className="text-[#738078] text-[13px] leading-[20px]"
                        >
                          Không tải được tên · {item.ingredientId}
                        </Text>
                      )}
                      <View className="flex-row items-center justify-between gap-[10px] bg-[#F2F7F2] p-[14px] rounded-[14px] flex-wrap">
                        <Text className="text-[#738078] text-[13px] leading-[20px]">
                          Số lượng nhập kho
                        </Text>
                        <Text className="text-[#236347] text-[18px] font-bold">
                          +{count(item.receivedQuantity)}{' '}
                          {ingredient?.baseUnit || ''}
                        </Text>
                      </View>
                      {item.unitId && (
                        <Text className="text-[#738078] text-[13px] leading-[20px]">
                          Số lượng thực nhận: {count(item.inputQuantity)}{' '}
                          {model.units.data?.find(
                            (unit) => unit.unitId === item.unitId,
                          )?.name || '(chưa tải được đơn vị)'}
                          {' · '}Hệ số: {count(item.conversionFactorSnapshot)}
                        </Text>
                      )}
                      <View className="flex-row items-center justify-between gap-[10px] flex-wrap">
                        <View className="flex-row items-center gap-[6px]">
                          <Ionicons
                            name="calendar-outline"
                            size={15}
                            color={'#738078'}
                          />
                          <Text className="text-[#738078] text-[13px] leading-[20px]">
                            Hạn sử dụng
                          </Text>
                        </View>
                        <Text className="text-[13px] text-[#23382D] font-semibold">
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
                    <Text className="text-[#738078] text-[13px] leading-[20px]">
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
                      className={`min-h-[52px] rounded-[16px] bg-[#236347] items-center justify-center p-[12px] ${
                        model.detail.isFetching ||
                        model.detail.isError ||
                        model.confirm.isPending
                          ? 'opacity-[0.5]'
                          : ''
                      }`}
                    >
                      {model.confirm.isPending ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-[#fff] text-[14px] font-bold">
                          Xác nhận nhập kho
                        </Text>
                      )}
                    </Pressable>
                  </>
                )}
                {receipt.status === 'Confirmed' && (
                  <View
                    className="p-[18px] rounded-[22px] bg-[#EAF4ED] border-[1px] border-[#E8EEE9] gap-[14px]"
                    style={{ boxShadow: '0 4px 20px rgba(21,63,48,0.025)' }}
                  >
                    <Text className="text-[#236347] leading-[22px]">
                      Đã cập nhật tồn kho và ghi nhận lịch sử nhập hàng.
                    </Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={model.confirm.isPending || model.detail.isFetching}
                  onPress={() => void model.detail.refetch()}
                  className={`min-h-[52px] rounded-[16px] bg-[#fff] items-center justify-center p-[12px] border-[1px] border-[#CBDDD1] ${model.confirm.isPending || model.detail.isFetching ? 'opacity-[0.5]' : ''}`}
                >
                  {model.detail.isFetching ? (
                    <ActivityIndicator color="#236347" />
                  ) : (
                    <Text className="text-[#236347] text-[14px] font-bold">
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
        <View className="grow-[1] shrink-0 basis-[0px] bg-[rgba(12,34,24,0.4)] justify-center p-[24px]">
          <Pressable
            accessibilityLabel="Đóng xác nhận"
            disabled={model.confirm.isPending}
            onPress={() => setConfirmOpen(false)}
            className="absolute top-[0px] bottom-[0px] left-[0px] right-[0px]"
          />
          <View
            accessibilityViewIsModal
            className="p-[18px] rounded-[22px] bg-[#fff] border-[1px] border-[#E8EEE9] gap-[18px] w-[100%] max-w-[420px] self-center"
            style={{ boxShadow: '0 4px 20px rgba(21,63,48,0.025)' }}
          >
            <Text className="text-[16px] text-[#23382D] font-bold">
              Nhập kho phiếu này?
            </Text>
            <Text className="text-[#738078] text-[13px] leading-[20px]">
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
              className={`min-h-[52px] rounded-[16px] bg-[#236347] items-center justify-center p-[12px] ${false || model.confirm.isPending ? 'opacity-[0.5]' : ''}`}
            >
              {model.confirm.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-[#fff] text-[14px] font-bold">
                  Xác nhận nhập kho
                </Text>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={model.confirm.isPending || false}
              onPress={() => setConfirmOpen(false)}
              className={`min-h-[52px] rounded-[16px] bg-[#fff] items-center justify-center p-[12px] border-[1px] border-[#CBDDD1] ${model.confirm.isPending || false ? 'opacity-[0.5]' : ''}`}
            >
              <Text className="text-[#236347] text-[14px] font-bold">
                Để sau
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </InventoryLayout>
  );
}
