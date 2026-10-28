import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Ingredient } from '../types/types';
import { quantity, StockBadge, stockColors as c } from './StockUI';

export function IngredientCard({
  ingredient,
  onPress,
}: {
  ingredient: Ingredient;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'View ' + ingredient.ingredientName}
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        pressed && { backgroundColor: '#FAFCFA' },
      ]}
    >
      {ingredient.isActive && ingredient.isLowStock && (
        <View style={s.lowAccent} />
      )}
      <View style={s.top}>
        <View
          style={[
            s.icon,
            ingredient.isActive &&
              ingredient.isLowStock && { backgroundColor: '#FFF3DF' },
          ]}
        >
          <Ionicons
            name="cube-outline"
            size={22}
            color={
              ingredient.isActive && ingredient.isLowStock ? c.amber : c.green
            }
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={2} style={s.name}>
            {ingredient.ingredientName}
          </Text>
          <Text numberOfLines={1} style={s.code}>
            {ingredient.ingredientCode}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#A4B1A8" />
      </View>
      <View style={s.bottom}>
        <View style={{ flexShrink: 1 }}>
          <Text style={s.caption}>On hand</Text>
          <Text style={s.quantity}>
            {quantity(ingredient.stockQuantity)}{' '}
            <Text style={s.unit}>{ingredient.baseUnit}</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <StockBadge
            label={
              !ingredient.isActive
                ? 'Inactive'
                : ingredient.isLowStock
                  ? 'Low stock'
                  : 'In stock'
            }
            tone={
              !ingredient.isActive
                ? 'gray'
                : ingredient.isLowStock
                  ? 'amber'
                  : 'green'
            }
          />
          <Text style={s.minimum}>
            Min. {quantity(ingredient.lowStockThreshold)} {ingredient.baseUnit}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: c.line,
    overflow: 'hidden',
  },
  lowAccent: {
    position: 'absolute',
    left: 0,
    top: 20,
    bottom: 20,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#DFAE61',
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 16, fontWeight: '600', lineHeight: 22, color: c.ink },
  code: { color: c.muted, fontSize: 10, marginTop: 4 },
  bottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderRadius: 12,
    backgroundColor: '#F6F8F5',
  },
  caption: {
    color: c.muted,
    fontSize: 11,
    fontWeight: '400',
  },
  quantity: { color: c.dark, fontSize: 25, fontWeight: '700', marginTop: 3 },
  unit: { color: c.muted, fontSize: 13, fontWeight: '500' },
  minimum: { color: c.muted, fontSize: 11 },
});
