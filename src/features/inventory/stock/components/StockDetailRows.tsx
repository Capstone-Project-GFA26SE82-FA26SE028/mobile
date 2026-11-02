import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import type { StockLot, StockMovement } from '../types/types';
import { formatQuantity } from '../utils/formatQuantity';
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge';
import { formatStockDate } from '../utils/formatStockDate';

export function StockLotCard({ lot, unit }: { lot: StockLot; unit: string }) {
  const label =
    lot.remainingQuantity === 0
      ? 'Đã hết'
      : lot.expiryStatus === 'Expired'
        ? 'Hết hạn'
        : lot.expiryStatus === 'ExpiringSoon'
          ? 'Sắp hết hạn'
          : lot.expiryStatus === 'Valid'
            ? 'Còn hạn'
            : 'Chưa có hạn dùng';
  const tone =
    lot.remainingQuantity === 0
      ? 'gray'
      : lot.expiryStatus === 'Expired'
        ? 'red'
        : lot.expiryStatus === 'ExpiringSoon'
          ? 'amber'
          : lot.expiryStatus === 'Valid'
            ? 'green'
            : 'gray';
  return (
    <View className="p-[16px] bg-[#fff] rounded-[16px] border-[1px] border-[#E4EBE6]">
      <View className="flex-row items-center flex-wrap gap-[10px]">
        <View className="w-[34px] h-[34px] rounded-[11px] justify-center items-center bg-[#F0F5EF]">
          <Ionicons name="layers-outline" size={20} color={'#236347'} />
        </View>
        <View className="grow-[1] shrink-0 basis-[0px]">
          <Text className="text-[#23382D] text-[14px] font-semibold leading-[20px]">
            Nhập ngày {formatStockDate(lot.receivedAt).split(',')[0]}
          </Text>
          <Text className="text-[#738078] text-[11px] mt-[4px] leading-[17px]">
            Đã nhập {formatQuantity(lot.receivedQuantity)} {unit}
          </Text>
        </View>
        <StatusBadge label={label} tone={tone} />
      </View>
      <View className="flex-row flex-wrap gap-[12px] justify-between items-end mt-[14px] pt-[14px] border-t-[1px] border-[#F0F3F0]">
        <View className="grow-[1] shrink-0 basis-[0px]">
          <Text className="text-[#738078] text-[10px] tracking-[0.2px] font-medium">
            CÒN LẠI
          </Text>
          <Text className="text-[#153F30] text-[23px] font-bold mt-[5px]">
            {formatQuantity(lot.remainingQuantity)}{' '}
            <Text className="text-[#738078] text-[12px] font-normal">
              {unit}
            </Text>
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[#738078] text-[10px] tracking-[0.2px] font-medium">
            HẠN SỬ DỤNG
          </Text>
          <Text
            className={`text-[13px] font-medium mt-[8px] ${lot.expiryStatus === 'Expired' ? 'text-[#B44741]' : 'text-[#23382D]'}`}
          >
            {formatStockDate(lot.expiryDate, true)}
          </Text>
        </View>
      </View>
      {!lot.canIssue && lot.remainingQuantity > 0 && (
        <Text className="text-[#B44741] text-[11px] mt-[12px]">
          Không thể xuất kho lô này
        </Text>
      )}
    </View>
  );
}

export function StockMovementCard({
  movement,
  unit,
}: {
  movement: StockMovement;
  unit: string;
}) {
  const positive = movement.quantityChange > 0;
  const labels: Record<string, string> = {
    Receipt: 'Nhập kho',
    Issue: 'Xuất kho thủ công',
    Cooking: 'Sử dụng tại bếp',
    Adjustment: 'Điều chỉnh tồn kho',
  };
  return (
    <View className="p-[16px] bg-[#fff] rounded-[16px] border-[1px] border-[#E4EBE6]">
      <View className="flex-row items-center flex-wrap gap-[10px]">
        <View
          className={`w-[34px] h-[34px] rounded-[11px] justify-center items-center ${positive ? 'bg-[#EAF4ED]' : 'bg-[#FFF3E4]'}`}
        >
          <Ionicons
            name={
              movement.movementType === 'Cooking'
                ? 'flame-outline'
                : positive
                  ? 'arrow-down-outline'
                  : 'arrow-up-outline'
            }
            size={20}
            color={positive ? '#236347' : '#A76A1B'}
          />
        </View>
        <View className="grow-[1] shrink-0 basis-[0px] min-w-[0px]">
          <Text className="text-[#23382D] text-[14px] font-semibold leading-[20px]">
            {labels[movement.movementType] || movement.movementType}
          </Text>
          <Text className="text-[#738078] text-[11px] mt-[4px] leading-[17px]">
            {formatStockDate(movement.createdAt)}
          </Text>
        </View>
      </View>
      <View className="mt-[14px] border-t-[1px] border-[#F0F3F0] pt-[12px] gap-[10px]">
        <Text selectable className="text-[#738078] text-[12px] leading-[19px]">
          {movement.reason || 'Chưa có lý do'}
        </Text>
        <Text
          className={`text-[20px] font-bold text-right ${positive ? 'text-[#236347]' : 'text-[#A76A1B]'}`}
        >
          {positive ? '+' : ''}
          {formatQuantity(movement.quantityChange)}{' '}
          <Text className="text-[#738078] text-[12px] font-normal">{unit}</Text>
        </Text>
      </View>
    </View>
  );
}
