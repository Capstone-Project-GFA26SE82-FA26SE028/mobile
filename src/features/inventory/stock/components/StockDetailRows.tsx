import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
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
    <View style={s.card}>
      <View style={s.row}>
        <View style={[s.icon, { backgroundColor: '#F0F5EF' }]}>
          <Ionicons name="layers-outline" size={20} color={'#236347'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>
            Nhập ngày {formatStockDate(lot.receivedAt).split(',')[0]}
          </Text>
          <Text style={s.subtitle}>
            Đã nhập {formatQuantity(lot.receivedQuantity)} {unit}
          </Text>
        </View>
        <StatusBadge label={label} tone={tone} />
      </View>
      <View style={s.lotBottom}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>CÒN LẠI</Text>
          <Text style={s.balance}>
            {formatQuantity(lot.remainingQuantity)}{' '}
            <Text style={s.unit}>{unit}</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.label}>HẠN SỬ DỤNG</Text>
          <Text
            style={[
              s.expiry,
              lot.expiryStatus === 'Expired' && { color: '#B44741' },
            ]}
          >
            {formatStockDate(lot.expiryDate, true)}
          </Text>
        </View>
      </View>
      {!lot.canIssue && lot.remainingQuantity > 0 && (
        <Text style={s.unavailable}>Không thể xuất kho lô này</Text>
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
    <View style={s.card}>
      <View style={s.row}>
        <View
          style={[
            s.icon,
            { backgroundColor: positive ? '#EAF4ED' : '#FFF3E4' },
          ]}
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.title}>
            {labels[movement.movementType] || movement.movementType}
          </Text>
          <Text style={s.subtitle}>{formatStockDate(movement.createdAt)}</Text>
        </View>
      </View>
      <View style={s.movementBottom}>
        <Text selectable style={s.reason}>
          {movement.reason || 'Chưa có lý do'}
        </Text>
        <Text style={[s.change, { color: positive ? '#236347' : '#A76A1B' }]}>
          {positive ? '+' : ''}
          {formatQuantity(movement.quantityChange)}{' '}
          <Text style={s.unit}>{unit}</Text>
        </Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4EBE6',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { color: '#23382D', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  subtitle: { color: '#738078', fontSize: 11, marginTop: 4, lineHeight: 17 },
  lotBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#F0F3F0',
  },
  label: {
    color: '#738078',
    fontSize: 10,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  balance: { color: '#153F30', fontSize: 23, fontWeight: '700', marginTop: 5 },
  unit: { color: '#738078', fontSize: 12, fontWeight: '400' },
  expiry: { color: '#23382D', fontSize: 13, fontWeight: '500', marginTop: 8 },
  unavailable: { color: '#B44741', fontSize: 11, marginTop: 12 },
  movementBottom: {
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: '#F0F3F0',
    paddingTop: 12,
    gap: 10,
  },
  reason: { color: '#738078', fontSize: 12, lineHeight: 19 },
  change: { fontSize: 20, fontWeight: '700', textAlign: 'right' },
});
