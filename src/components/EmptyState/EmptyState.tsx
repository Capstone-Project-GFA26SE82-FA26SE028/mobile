import type { ComponentProps, PropsWithChildren } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

export function EmptyState({
  title,
  children,
  icon = 'cube-outline',
}: PropsWithChildren<{
  title: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
}>) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={28} color={'#236347'} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {!!children && <Text style={s.emptyDescription}>{children}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  empty: {
    paddingHorizontal: 24,
    paddingVertical: 44,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E4EBE6',
    borderRadius: 20,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF4ED',
  },
  emptyTitle: {
    color: '#23382D',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyDescription: {
    color: '#738078',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
});
