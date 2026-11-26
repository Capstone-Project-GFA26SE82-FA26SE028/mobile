import { Pressable, Text, View } from 'react-native';

export function TableOverview({
  name,
  occupied,
  ready,
  pending,
  onOpenOrders,
}: {
  name: string;
  occupied: number | string;
  ready: number | string;
  pending: number | string;
  onOpenOrders: () => void;
}) {
  const metrics = [
    { label: 'Bàn có khách', value: occupied },
    { label: 'Phần chờ lên', value: ready },
  ];

  return (
    <View className="overflow-hidden rounded-[18px] bg-[#043D30]">
      <View className="flex-row flex-wrap items-center justify-between gap-x-[10px] border-b border-white/15 px-[16px] py-[8px]">
        <View className="min-w-0 flex-1 py-[4px]">
          <Text accessibilityRole="header" className="text-[17px] font-bold text-white">
            Ca phục vụ
          </Text>
          <Text numberOfLines={1} className="text-[12px] text-[#C3DECD]">
            {name}
          </Text>
        </View>
      </View>
      <View className="flex-row px-[5px] py-[12px]">
        {metrics.map(({ label, value }, index) => (
          <View
            key={label}
            className={`min-w-0 flex-1 gap-[4px] px-[12px] ${index > 0 ? 'border-l border-white/20' : ''}`}
          >
            <Text className="text-[24px] font-bold text-white">
              {typeof value === 'number' ? String(value).padStart(2, '0') : value}
            </Text>
            <Text className="text-[11px] text-[#C3DECD]">{label}</Text>
          </View>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Đơn chờ xác nhận, ${pending}`}
          onPress={onOpenOrders}
          className="min-w-0 flex-1 gap-[4px] border-l border-white/20 px-[12px] active:opacity-70"
        >
          <Text className="text-[24px] font-bold text-white">
            {typeof pending === 'number' ? String(pending).padStart(2, '0') : pending}
          </Text>
          <Text className="text-[11px] text-[#C3DECD]">Đơn chờ xác nhận ›</Text>
        </Pressable>
      </View>
    </View>
  );
}
