import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { ErrorState } from '@/components/ErrorState/ErrorState';
import { Loading } from '@/components/Loading/Loading';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import {
  useInventoryNotifications,
  useInventoryUnread,
} from '../hooks/useInventoryNotifications';

const tabs = ['Tất cả', 'Chưa xem', 'Đã xem'] as const;

export default function InventoryNotificationsScreen() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Tất cả');
  const { feed, read } = useInventoryNotifications();
  const unread = useInventoryUnread();
  const count = unread.data ?? feed.data?.filter((item) => !item.readAt).length ?? 0;
  const rows = (feed.data ?? []).filter(
    (item) => tab === 'Tất cả' || (tab === 'Chưa xem' ? !item.readAt : !!item.readAt),
  );

  return (
    <InventoryLayout title="Thông báo" back="/inventory" showNotifications={false}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, gap: 12 }}
      >
        <View className="flex-row gap-2 rounded-[16px] bg-[#E8EFEA] p-1">
          {tabs.map((option) => (
            <Pressable
              key={option}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === option }}
              onPress={() => setTab(option)}
              className={`min-h-[42px] flex-1 items-center justify-center rounded-[12px] ${tab === option ? 'bg-white' : ''}`}
            >
              <Text className={`text-[13px] font-semibold ${tab === option ? 'text-[#12664C]' : 'text-[#53665B]'}`}>
                {option}
                {option === 'Chưa xem' && count > 0 ? ` (${count})` : ''}
              </Text>
            </Pressable>
          ))}
        </View>
        {count > 0 && (
          <Pressable
            accessibilityRole="button"
            disabled={read.isPending}
            onPress={() => read.mutate(null)}
            className="min-h-[44px] self-end justify-center rounded-[12px] border-[1px] border-[#DDE8E0] bg-white px-3 disabled:opacity-50"
          >
            <Text className="text-[13px] font-semibold text-[#12664C]">
              Đánh dấu tất cả đã xem
            </Text>
          </Pressable>
        )}
        {read.isError && (
          <Text accessibilityRole="alert" className="text-[13px] text-[#A93532]">
            Chưa đánh dấu được. Vui lòng thử lại.
          </Text>
        )}
        {feed.isError && (
          <ErrorState
            message="Không tải được thông báo."
            onRetry={() => void feed.refetch()}
          />
        )}
        {feed.isPending && <Loading />}
        {feed.isSuccess && rows.length === 0 && (
          <EmptyState title="Chưa có thông báo trong mục này" />
        )}
        {rows.map((item) => (
          <View key={item.id} className="gap-3 rounded-[18px] border-[1px] border-[#E4EBE6] bg-white p-4">
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-[#EAF5EF]">
                <Ionicons name="notifications-outline" size={20} color="#236347" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#23382D]">{item.title}</Text>
                <Text className="mt-1 text-[11px] text-[#53665B]">
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                </Text>
              </View>
              <Text className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.readAt ? 'bg-[#EAF5EF] text-[#236347]' : 'bg-[#FFF4DE] text-[#8A5316]'}`}>
                {item.readAt ? 'Đã xem' : 'Chưa xem'}
              </Text>
            </View>
            <Text className="text-[14px] leading-[21px] text-[#53665B]">{item.message}</Text>
            {!item.readAt && (
              <Pressable
                accessibilityRole="button"
                disabled={read.isPending}
                onPress={() => read.mutate(item.id)}
                className="min-h-[42px] items-center justify-center rounded-[12px] bg-[#12664C] disabled:opacity-50"
              >
                <Text className="text-[13px] font-semibold text-white">Đánh dấu đã xem</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </InventoryLayout>
  );
}
