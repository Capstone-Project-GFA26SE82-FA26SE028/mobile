import { Text, View } from 'react-native';

export function StatusBadge({
  label,
  tone = 'green',
  dot = true,
}: {
  label: string;
  tone?: 'green' | 'amber' | 'red' | 'gray' | 'blue';
  dot?: boolean;
}) {
  const color = {
    green: '#236347',
    amber: '#A76A1B',
    red: '#B44741',
    gray: '#738078',
    blue: '#3B7CB0',
  }[tone];
  const backgroundColor = {
    green: '#EAF4ED',
    amber: '#FFF3DF',
    red: '#FFF0EC',
    gray: '#EFF2EF',
    blue: '#EDF4FC',
  }[tone];
  return (
    <View
      className="flex-row items-center gap-[5px] px-[9px] py-[6px] rounded-[9px] self-start"
      style={{ backgroundColor }}
    >
      {dot && (
        <View
          className="w-[5px] h-[5px] rounded-[3px]"
          style={{ backgroundColor: color }}
        />
      )}
      <Text className="text-[11px] font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

