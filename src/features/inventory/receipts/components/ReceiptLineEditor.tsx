import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Pressable, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppSelector } from '../../../../app/hooks';
import { getIngredientConversions, getReceiptUnits, receiptError } from '../api/receiptApi';
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
    <View style={r.card}>
      <View style={r.row}>
        <View style={[r.mark, { width: 38, height: 38, borderRadius: 12 }]}>
          <Text style={{ fontSize: 14, color: '#236347', fontWeight: '700' }}>
            {String(index + 1).padStart(2, '0')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={r.heading}>{line.ingredient.ingredientName}</Text>
          <Text style={r.muted}>{line.ingredient.ingredientCode}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xóa dòng ${index + 1}`}
          disabled={disabled}
          onPress={onRemove}
          style={[
            r.icon,
            {
              borderWidth: 0,
              backgroundColor: '#FFF4F2',
              width: 36,
              height: 40,
            },
          ]}
        >
          <Ionicons name="trash-outline" size={19} color={'#B44741'} />
        </Pressable>
      </View>
      <View style={r.divider} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={r.label}>Số lượng</Text>
          <TextInput
            accessibilityLabel={`Số lượng dòng ${index + 1}`}
            value={line.quantity}
            editable={!disabled}
            onChangeText={(quantity) => onChange({ quantity })}
            keyboardType="decimal-pad"
            placeholder="0"
            maxLength={20}
            style={r.input}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={r.label}>Đơn vị</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Đơn vị dòng ${index + 1}`}
            disabled={disabled}
            onPress={() => setExpanded(!expanded)}
            style={[r.input, r.row]}
          >
            <Text style={{ color: '#23382D', flex: 1 }}>{line.unitLabel}</Text>
            <Ionicons name="chevron-down" size={15} color={'#738078'} />
          </Pressable>
        </View>
      </View>
      {expanded && !disabled && (
        <View style={{ gap: 6 }}>
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
            style={r.input}
          >
            <Text style={{ color: '#236347' }}>
              {line.ingredient.baseUnit} · Đơn vị gốc
            </Text>
          </Pressable>
          {(units.isPending || conversions.isPending) && (
            <Text style={r.muted}>Đang tải đơn vị…</Text>
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
              style={r.input}
              onPress={() => {
                onChange({
                  unitId: option.id,
                  unitLabel: option.name,
                  factor: option.factor,
                });
                setExpanded(false);
              }}
            >
              <Text style={{ color: '#23382D' }}>
                {option.name} = {option.factor} {line.ingredient.baseUnit}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <View>
        <Text style={r.label}>Hạn sử dụng</Text>
        <View
          style={[
            r.input,
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 0,
              gap: 6,
            },
          ]}
        >
          {['Ngày', 'Tháng', 'Năm'].map((label, part) => (
            <View
              key={label}
              style={{
                flex: part === 2 ? 1.4 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {part > 0 && (
                <Text style={{ color: '#738078', fontSize: 17 }}>/</Text>
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
                style={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 48,
                  paddingVertical: 12,
                  color: '#23382D',
                  fontSize: 15,
                  textAlign: 'center',
                  fontVariant: ['tabular-nums'],
                }}
              />
            </View>
          ))}
        </View>
      </View>
      {line.unitId && (
        <Text style={r.muted}>
          1 {line.unitLabel} = {line.factor} {line.ingredient.baseUnit}
        </Text>
      )}
    </View>
  );
}

const r = StyleSheet.create({
  icon: {
    width: 42,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E7EDE8',
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
  divider: { height: 1, backgroundColor: '#EFF3EF' },
});
