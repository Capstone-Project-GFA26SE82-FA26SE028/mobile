import UnsupportedWaiterScreen from '../../shared/components/UnsupportedWaiterScreen';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppSelector } from '@/app/hooks';
import {
  Badge,
  Button,
  Card,
  Chips,
  Empty,
  Icon,
  Notice,
  Page,
  Title,
} from '../../shared/components/UI';
import { colors } from '../../shared/utils/theme';
import { runCommand, useNow } from '../../shared/hooks/useWaiterCommands';
import { minutes, time } from '../../shared/utils/rules';
function DemoRequestsScreen() {
  const state = useAppSelector((s) => s.waiter);
  const now = useNow();
  const router = useRouter();
  const [tab, setTab] = useState('Đang chờ');
  const first = state.requests
    .filter((r) => r.status === 'new')
    .sort((a, b) => a.createdAt - b.createdAt)[0];
  const rows = state.requests
    .filter((r) =>
      tab === 'Đã xong' ? r.status === 'done' : r.status !== 'done',
    )
    .sort((a, b) => a.createdAt - b.createdAt);
  return (
    <Page>
      <Title
        title="Yêu cầu của khách"
        subtitle="Một chút quan tâm, thêm nhiều hài lòng."
      />
      <Chips options={['Đang chờ', 'Đã xong']} value={tab} onChange={setTab} />
      <Text className="text-[11px] leading-[16px] text-[#7C8983]">
        Ưu tiên yêu cầu đến trước · Cảnh báo khi chờ quá 3 phút
      </Text>
      {rows.map((r) => {
        const table = state.tables.find((t) => t.sessionId === r.sessionId);
        const late = r.status !== 'done' && now - r.createdAt > 180000;
        return (
          <Card key={r.id}>
            <View className="flex-row items-center justify-between gap-[10px]">
              <View className="flex-row items-center gap-[10px]">
                <View
                  className="rounded-[12px] p-[10px]"
                  style={{ backgroundColor: late ? '#FDF0ED' : colors.mint }}
                >
                  <Icon
                    name={
                      r.type === 'Yêu cầu thanh toán'
                        ? 'wallet-outline'
                        : 'hand-left-outline'
                    }
                    color={late ? colors.red : colors.green}
                  />
                </View>
                <View>
                  <Text className="text-[17px] font-[700] text-[#183B32]">
                    {table?.name || 'Phiên đã đóng'}
                  </Text>
                  <Text className="text-[11px] leading-[16px] text-[#7C8983]">
                    {time(r.createdAt)} · {minutes(r.createdAt, now)} phút trước
                  </Text>
                </View>
              </View>
              <Badge
                text={
                  r.status === 'done'
                    ? 'Hoàn tất'
                    : r.status === 'processing'
                      ? 'Đang xử lý'
                      : 'Mới'
                }
                tone={r.status === 'new' ? 'amber' : 'green'}
              />
            </View>
            <Text className="text-[14px] leading-[21px] text-[#183B32] font-[600]">
              {r.type}
            </Text>
            <Text className="text-[12px] leading-[19px] text-[#7C8983]">
              {r.note}
            </Text>
            {late && (
              <Notice
                text="Đã quá 3 phút · Cần Manager chú ý. Cảnh báo đang hiển thị trong bản dùng thử."
                error
              />
            )}
            {r.status === 'new' && (
              <Button
                title={
                  first?.id === r.id
                    ? 'Tiếp nhận yêu cầu'
                    : 'Chờ tiếp nhận yêu cầu trước'
                }
                disabled={first?.id !== r.id}
                onPress={() =>
                  runCommand({
                    type: 'request',
                    requestId: r.id,
                    status: 'processing',
                  })
                }
              />
            )}
            {r.status === 'processing' && (
              <>
                <Button
                  title="Đã xử lý xong"
                  icon="checkmark"
                  onPress={() =>
                    runCommand({
                      type: 'request',
                      requestId: r.id,
                      status: 'done',
                    })
                  }
                />
                {r.type === 'Yêu cầu thanh toán' && table && (
                  <Button
                    title="Mở thu hộ tiền mặt"
                    secondary
                    onPress={() =>
                      router.push({
                        pathname: '/waiter/payment/[id]',
                        params: { id: table.id },
                      })
                    }
                  />
                )}
              </>
            )}
          </Card>
        );
      })}
      {!rows.length && <Empty text="Không có yêu cầu trong danh sách này." />}
    </Page>
  );
}

export default function RequestsScreen() {
  const apiMode = useAppSelector((s) => s.waiter.authMode === 'api');
  return apiMode ? (
    <UnsupportedWaiterScreen
      title="Yêu cầu của khách"
      subtitle="Một chút quan tâm, thêm nhiều hài lòng."
      tabs={['Đang chờ', 'Đã xong']}
    />
  ) : (
    <DemoRequestsScreen />
  );
}
