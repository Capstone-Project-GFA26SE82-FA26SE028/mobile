import { StyleSheet, Text, View } from 'react-native';

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
    <View style={[s.badge, { backgroundColor }]}>
      {dot && (
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      )}
      <Text style={{ fontSize: 11, color, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    alignSelf: 'flex-start',
  },
});
