import type { ReactNode } from 'react';
import { View } from 'react-native';

export function TableGrid<T>({
  items,
  getKey,
  renderItem,
}: {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}) {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }

  return (
    <View className="gap-[12px]">
      {rows.map((row) => (
        <View key={getKey(row[0])} className="flex-row gap-[12px]">
          {row.map((item) => (
            <View key={getKey(item)} style={{ flex: 1, minWidth: 0 }}>
              {renderItem(item)}
            </View>
          ))}
          {row.length === 1 && <View style={{ flex: 1, minWidth: 0 }} />}
        </View>
      ))}
    </View>
  );
}
