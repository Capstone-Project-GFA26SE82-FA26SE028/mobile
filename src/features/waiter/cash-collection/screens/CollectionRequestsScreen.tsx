import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import {
  Page,
  Title,
  Card,
  Button,
  Empty,
  Notice,
} from '../../shared/components/UI';
import { QueryStatus } from '../../shared/components/QueryStatus';
import { useServiceTables } from '../../tables/hooks/useTables';
import { useCollectionQuery } from '../hooks/useCollection';
import { collectionApi } from '../api/collectionApi';
import { money } from '../../shared/utils/rules';
export default function CollectionRequestsScreen() {
  const router = useRouter();
  const user = useAppSelector((s) => s.waiter.waiter?.id);
  const saved = useAppSelector((s) => s.waiterCollection.drafts);
  const tables = useServiceTables();
  const restaurants = [
    ...new Set(tables.data?.map((t) => t.restaurantId) ?? []),
  ].sort();
  const query = useCollectionQuery(
    'requests:' + restaurants.join(','),
    async (signal) =>
      (
        await Promise.all(
          restaurants.map((id) => collectionApi.list(id, signal)),
        )
      )
        .flat()
        .sort((a, b) => Date.parse(a.requestedAt) - Date.parse(b.requestedAt)),
    restaurants.length > 0,
  );
  return (
    <Page>
      <Title
        title="Thanh toán & tiền mặt"
        subtitle="Chọn bàn để nhập tiền khách đưa và gửi báo cáo bàn giao cho thu ngân."
      />
      <Notice text="Tiếp nhận yêu cầu → gửi thu ngân chốt bill → đưa bill cho khách → nhập tiền mặt và gửi thu ngân. Khoản thu hoàn tất khi thu ngân xác nhận đã nhận tiền." />
      <QueryStatus query={tables} />
      {restaurants.length > 0 && <QueryStatus query={query} />}
      {Object.entries(saved)
        .filter(
          ([id, draft]) =>
            draft.sessionId &&
            !query.data?.some((r) => r.serviceRequestId === id),
        )
        .map(([id, draft]) => (
          <Card key={id}>
            <Title
              title="Giao dịch thu hộ đã ghi nhận"
              subtitle="Xem kết quả xác nhận từ thu ngân"
            />
            <Text>Số tiền giao thu ngân: {money(draft.received)}</Text>
            <Notice text={draft.handover?.paymentStatus === 'Paid'
              ? 'Thu ngân đã xác nhận nhận tiền.'
              : draft.handover
                ? 'Đã gửi báo cáo. Chờ thu ngân xác nhận nhận tiền.'
                : 'Giao dịch cần kiểm tra lại trước khi thu thêm tiền.'} />
            <Button
              title="Theo dõi bàn giao tiền"
              onPress={() =>
                router.push({
                  pathname: '/waiter/payment/[id]',
                  params: {
                    id: draft.tableId || draft.sessionId!,
                    sessionId: draft.sessionId!,
                    restaurantId: draft.restaurantId || '',
                    requestId: id,
                  },
                })
              }
            />
          </Card>
        ))}
      {query.data?.map((request) => (
        <Card key={request.serviceRequestId}>
          <Title
            title={request.tables.map((t) => t.tableCode).join(', ')}
            subtitle={new Date(request.requestedAt).toLocaleString('vi-VN')}
          />
          <Notice
            text={
              request.status === 'Requested'
                ? 'Khách đang chờ thanh toán'
                : 'Đã tiếp nhận yêu cầu'
            }
          />
          <Button
            title={
              request.handledByRef && request.handledByRef !== user
                ? 'Nhân viên khác đang xử lý'
                : 'Nhập tiền mặt / xử lý thanh toán'
            }
            disabled={!!request.handledByRef && request.handledByRef !== user}
            onPress={() =>
              router.push({
                pathname: '/waiter/payment/[id]',
                params: {
                  id: request.tables[0]?.tableId || request.tableSessionId,
                  restaurantId: request.restaurantId,
                  sessionId: request.tableSessionId,
                  requestId: request.serviceRequestId,
                },
              })
            }
          />
        </Card>
      ))}
      {((query.isSuccess && !query.data.length) ||
        (tables.isSuccess && !restaurants.length)) && (
        <Empty text="Chưa có yêu cầu thanh toán." />
      )}
    </Page>
  );
}
