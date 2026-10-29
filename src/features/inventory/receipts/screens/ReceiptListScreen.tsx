import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge';
import { Loading } from '../../../../components/Loading/Loading';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { LoadMoreButton } from '../../../../components/LoadMoreButton/LoadMoreButton';
import { receiptError } from '../api/receiptApi';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  FlatList,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import { useReceiptList } from '../hooks/useReceipts';
import { receiptDate } from '../utils/receiptDate';

export default function ReceiptListScreen() {
  const router = useRouter();
  const { list, items } = useReceiptList();
  return (
    <InventoryLayout>
      <FlatList
        data={items}
        keyExtractor={(item) => item.goodsReceiptId}
        contentContainerStyle={r.content}
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={() => void list.refetch()}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <View
              style={{
                borderRadius: 22,
                backgroundColor: '#153F30',
                padding: 22,
                gap: 18,
                overflow: 'hidden',
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: 170,
                  height: 170,
                  borderRadius: 85,
                  right: -70,
                  top: -60,
                  borderWidth: 1,
                  borderColor: '#FFFFFF10',
                }}
              />
              <View style={r.row}>
                <View style={{ gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: '#BDD2C5',
                      fontWeight: '600',
                    }}
                  >
                    QUẢN LÝ NHẬP KHO
                  </Text>
                  <Text
                    style={{
                      fontSize: 26,
                      color: '#fff',
                      fontWeight: '700',
                      letterSpacing: -0.5,
                    }}
                  >
                    Nhận hàng vào kho
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={false || false}
                onPress={() => router.push('/goods-receipt-create')}
                style={[
                  r.button,
                  r.secondaryButton,
                  (false || false) && { opacity: 0.5 },
                ]}
              >
                <Text style={[r.buttonText, { color: '#236347' }]}>
                  + Tạo phiếu nhập
                </Text>
              </Pressable>
            </View>
            <Text style={r.heading}>
              Danh sách phiếu
              {list.data ? ` · ${list.data.pages[0].totalCount}` : ''}
            </Text>
            {list.isError && (
              <ErrorState
                message={receiptError(list.error)}
                onRetry={() => void list.refetch()}
              />
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: '/goods-receipt-detail',
                params: { id: item.goodsReceiptId },
              })
            }
            style={[r.card, { gap: 14 }]}
          >
            <View style={r.row}>
              <View style={[r.row, { flex: 1, justifyContent: 'flex-start' }]}>
                <View style={r.mark}>
                  <Ionicons
                    name="document-text-outline"
                    size={23}
                    color={'#236347'}
                  />
                </View>
                <Text style={[r.muted, { fontSize: 12 }]}>Phiếu nhập</Text>
              </View>
              <StatusBadge
                label={
                  item.status === 'Confirmed'
                    ? 'Đã nhập kho'
                    : item.status === 'Draft'
                      ? 'Bản nháp'
                      : item.status
                }
                tone={item.status === 'Confirmed' ? 'green' : 'amber'}
              />
            </View>
            <Text
              style={[r.heading, { fontSize: 14 }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {item.receiptCode}
            </Text>
            <View style={r.divider} />
            <View style={[r.row, { flexWrap: 'wrap' }]}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                <Ionicons name="calendar-outline" size={14} color={'#738078'} />
                <Text style={[r.muted, { fontSize: 12 }]}>
                  {receiptDate(item.createdAt)}
                </Text>
              </View>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
              >
                <Text style={{ fontSize: 12, color: '#236347' }}>
                  {item.items.length} nguyên liệu
                </Text>
                <Ionicons name="chevron-forward" size={15} color={'#236347'} />
              </View>
            </View>
            {!!item.note && (
              <Text numberOfLines={1} style={r.muted}>
                {item.note}
              </Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          list.isPending ? (
            <Loading />
          ) : !list.isError ? (
            <EmptyState title="Chưa có phiếu nhập" icon="document-text-outline">
              Tạo phiếu đầu tiên khi nhận nguyên liệu.
            </EmptyState>
          ) : null
        }
        ListFooterComponent={
          list.hasNextPage ? (
            <LoadMoreButton
              busy={list.isFetchingNextPage}
              onPress={() => void list.fetchNextPage()}
            />
          ) : null
        }
      />
    </InventoryLayout>
  );
}

const r = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#236347',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBDDD1',
  },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  content: {
    padding: 18,
    paddingTop: 8,
    gap: 14,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  mark: {
    width: 42,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF4ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8EEE9',
    gap: 14,
    boxShadow: '0 4px 20px rgba(21,63,48,0.025)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  muted: { color: '#738078', fontSize: 13, lineHeight: 20 },
  heading: { fontSize: 16, color: '#23382D', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#EFF3EF' },
});
