import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import type { StockLot, StockMovement } from '../types/types';
import { quantity, StockBadge, stockDate, stockColors as c } from './StockUI';

export function StockLotCard({ lot, unit }: { lot: StockLot; unit: string }) {
  const label =
    lot.remainingQuantity === 0
      ? 'Depleted'
      : lot.expiryStatus === 'Expired'
        ? 'Expired'
        : lot.expiryStatus === 'ExpiringSoon'
          ? 'Expiring soon'
          : lot.expiryStatus === 'Valid'
            ? 'Valid'
            : 'Expiry unknown';
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
          <Ionicons name="layers-outline" size={20} color={c.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>
            Received {stockDate(lot.receivedAt).split(',')[0]}
          </Text>
          <Text style={s.subtitle}>
            {quantity(lot.receivedQuantity)} {unit} received
          </Text>
        </View>
        <StockBadge label={label} tone={tone} />
      </View>
      <View style={s.lotBottom}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>REMAINING</Text>
          <Text style={s.balance}>
            {quantity(lot.remainingQuantity)} <Text style={s.unit}>{unit}</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.label}>EXPIRY DATE</Text>
          <Text
            style={[
              s.expiry,
              lot.expiryStatus === 'Expired' && { color: c.red },
            ]}
          >
            {stockDate(lot.expiryDate, true)}
          </Text>
        </View>
      </View>
      {!lot.canIssue && lot.remainingQuantity > 0 && (
        <Text style={s.unavailable}>Not available for issue</Text>
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
    Receipt: 'Stock received',
    Issue: 'Manual issue',
    Cooking: 'Kitchen usage',
    Adjustment: 'Stock adjustment',
  };
  return (
    <View style={s.card}>
      <View style={s.row}>
        <View
          style={[s.icon, { backgroundColor: positive ? c.mint : '#FFF3E4' }]}
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
            color={positive ? c.green : c.amber}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.title}>
            {labels[movement.movementType] || movement.movementType}
          </Text>
          <Text style={s.subtitle}>{stockDate(movement.createdAt)}</Text>
        </View>
      </View>
      <View style={s.movementBottom}>
        <Text selectable style={s.reason}>
          {movement.reason || 'No reason provided'}
        </Text>
        <Text style={[s.change, { color: positive ? c.green : c.amber }]}>
          {positive ? '+' : ''}
          {quantity(movement.quantityChange)} <Text style={s.unit}>{unit}</Text>
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
    borderColor: c.line,
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
  title: { color: c.ink, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  subtitle: { color: c.muted, fontSize: 11, marginTop: 4, lineHeight: 17 },
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
    color: c.muted,
    fontSize: 10,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  balance: { color: c.dark, fontSize: 23, fontWeight: '700', marginTop: 5 },
  unit: { color: c.muted, fontSize: 12, fontWeight: '400' },
  expiry: { color: c.ink, fontSize: 13, fontWeight: '500', marginTop: 8 },
  unavailable: { color: c.red, fontSize: 11, marginTop: 12 },
  movementBottom: {
    marginTop: 14,
    borderTopWidth: 1,
    borderColor: '#F0F3F0',
    paddingTop: 12,
    gap: 10,
  },
  reason: { color: c.muted, fontSize: 12, lineHeight: 19 },
  change: { fontSize: 20, fontWeight: '700', textAlign: 'right' },
});
