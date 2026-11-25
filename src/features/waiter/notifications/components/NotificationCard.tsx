import { Text } from 'react-native';
import { Badge, Button, Card, Title } from '../../shared/components/UI';
import type { StaffNotification } from '@/features/notifications/types/types';
export function NotificationCard({
  item,
  busy,
  onRead,
  onDetails,
}: {
  item: StaffNotification;
  busy: boolean;
  onRead: () => void;
  onDetails: () => void;
}) {
  return (
    <Card>
      <Title
        title={item.title}
        subtitle={new Date(item.createdAt).toLocaleString('vi-VN')}
        action={
          <Badge
            text={item.readAt ? 'Đã xem' : 'Chưa xem'}
            tone={item.readAt ? 'green' : 'amber'}
          />
        }
      />
      <Text className="text-[14px] leading-[21px] text-[#183B32]">
        {item.message}
      </Text>
      {!item.readAt && (
        <Button title="Đánh dấu đã xem" disabled={busy} onPress={onRead} />
      )}
      <Button title="Xem chi tiết" secondary onPress={onDetails} />
    </Card>
  );
}
