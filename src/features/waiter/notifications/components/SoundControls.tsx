import { Switch, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button, Card, Notice } from '../../shared/components/UI';
import {
  notificationSoundFailed,
  setNotificationSound,
} from '../store/notificationSlice';
import { useBell } from '../hooks/useBell';
import { useState } from 'react';
import { authService } from '@/features/auth/api/authApi';
export function SoundControls() {
  const dispatch = useAppDispatch();
  const { soundEnabled, soundError } = useAppSelector(
    (s) => s.waiterNotifications,
  );
  const play = useBell();
  const [testing, setTesting] = useState(false);
  async function test() {
    const identity = authService.identity();
    setTesting(true);
    try {
      await play();
      if (identity === authService.identity())
        dispatch(notificationSoundFailed(null));
    } catch {
      if (identity === authService.identity())
        dispatch(
          notificationSoundFailed(
            'Chưa phát được chuông. Kiểm tra âm lượng và cho phép trình duyệt phát âm thanh.',
          ),
        );
    } finally {
      setTesting(false);
    }
  }
  return (
    <Card>
      <View className="flex-row items-center justify-between gap-[10px]">
        <Text className="text-[14px] text-[#183B32] font-[600]">
          Chuông thông báo mới
        </Text>
        <Switch
          accessibilityLabel="Bật tiếng chuông thông báo"
          value={soundEnabled}
          onValueChange={(value) => {
            dispatch(setNotificationSound(value));
          }}
        />
      </View>
      <Text className="text-[12px] text-[#7C8983]">
        Phát chuông khi có thông báo mới lúc ứng dụng đang mở.
      </Text>
      <Button
        title="Thử chuông"
        secondary
        icon="volume-high-outline"
        disabled={testing}
        onPress={() => {
          void test();
        }}
      />
      {soundError && <Notice error text={soundError} />}
    </Card>
  );
}
