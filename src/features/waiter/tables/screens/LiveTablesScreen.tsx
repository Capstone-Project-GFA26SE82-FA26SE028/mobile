import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useAppSelector } from '@/app/hooks';
import { Badge, Button, Card, Chips, Empty, Page, Search, Title } from '../../shared/components/UI';
import { ui } from '../../shared/theme';
import { useServiceTables } from '../hooks/useTables';
import { QueryStatus } from '../../shared/components/QueryStatus';

export default function LiveTablesScreen() {
  const router = useRouter();
  const name = useAppSelector(s => s.waiter.waiter?.name);
  const tables = useServiceTables();
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('Tất cả');
  const [status, setStatus] = useState('Tất cả');
  const rows = tables.data ?? [];
  const filtered = rows.filter(t => (area === 'Tất cả' || t.areaName === area) &&
    t.tableCode.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
    (status === 'Tất cả' || (status === 'Có khách' ? t.openSessionIds.length > 0 : t.openSessionIds.length === 0)));
  return <Page>
    <Title title={`Xin chào, ${name || 'bạn'}!`} subtitle="Bàn phục vụ được cập nhật mỗi 5 giây." />
    <Button title="Xem và xác nhận đơn khách" onPress={() => router.push('/waiter/orders')} />
    <QueryStatus query={tables} />
    <Chips options={['Tất cả', ...new Set(rows.map(t => t.areaName))]} value={area} onChange={setArea} />
    <Chips options={['Tất cả', 'Có khách', 'Chưa mở phiên']} value={status} onChange={setStatus} />
    <Search value={search} onChange={setSearch} placeholder="Tìm mã bàn…" />
    {filtered.map(t => <Card key={t.tableId}>
      <Title title={t.tableCode} subtitle={t.areaName} action={<Badge text={t.openSessionIds.length ? 'Có khách' : 'Chưa mở phiên'} />} />
      <Text style={ui.small}>Dọn bàn: {t.cleaningStatus}</Text>
      <Button title="Xem bàn" secondary onPress={() => router.push({ pathname: '/waiter/table/[id]', params: { id: t.tableId } })} />
    </Card>)}
    {tables.isSuccess && !filtered.length && <Empty text="Không có bàn phù hợp." />}
  </Page>;
}

