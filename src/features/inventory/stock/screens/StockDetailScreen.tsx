import { stockError } from '../api/stockApi';
import { useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import { useStockDetail } from '../hooks/useStock';
import { LoadMoreButton } from '../../../../components/LoadMoreButton/LoadMoreButton';
import { formatQuantity } from '../utils/formatQuantity';
import { StatusBadge } from '../../../../components/StatusBadge/StatusBadge';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { Loading } from '../../../../components/Loading/Loading';
import { StockLotCard, StockMovementCard } from '../components/StockDetailRows';
import type { StockLot, StockMovement } from '../types/types';

export default function StockDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = typeof params.id === 'string' ? params.id : '';
  return <IngredientDetails key={id} id={id} />;
}
type Row =
  | { kind: 'lot'; item: StockLot }
  | { kind: 'history'; item: StockMovement };

function IngredientDetails({ id }: { id: string }) {
  const model = useStockDetail(id);
  const ingredient = model.ingredient.data;
  const active = model.tab === 'lots' ? model.lots : model.history;
  const data: Row[] =
    model.tab === 'lots'
      ? [
          ...new Map(
            model.lots.data?.pages
              .flatMap((page) => page.items)
              .map((item) => [item.goodsReceiptItemId, item]),
          ).values(),
        ].map((item) => ({ kind: 'lot', item }))
      : [
          ...new Map(
            model.history.data?.pages
              .flatMap((page) => page.items)
              .map((item) => [item.stockMovementId, item]),
          ).values(),
        ].map((item) => ({ kind: 'history', item }));
  return (
    <InventoryLayout
      title="Chi tiết nguyên liệu"
      subtitle="Tồn kho, lô hàng và lịch sử"
      back="/inventory"
    >
      {!model.validId ? (
        <View style={s.content}>
          <EmptyState title="Nguyên liệu không hợp lệ">
            Quay lại tồn kho và chọn một nguyên liệu.
          </EmptyState>
        </View>
      ) : model.ingredient.isPending ? (
        <Loading />
      ) : !ingredient ? (
        <View style={s.content}>
          <ErrorState
            message={stockError(model.ingredient.error)}
            busy={model.ingredient.isFetching}
            onRetry={() => void model.ingredient.refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(row) =>
            row.kind === 'lot'
              ? row.item.goodsReceiptItemId
              : row.item.stockMovementId
          }
          contentContainerStyle={s.content}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshing={
            model.ingredient.isRefetching ||
            (active.isRefetching && !active.isFetchingNextPage)
          }
          onRefresh={() => void model.refresh()}
          renderItem={({ item }) =>
            item.kind === 'lot' ? (
              <StockLotCard lot={item.item} unit={ingredient.baseUnit} />
            ) : (
              <StockMovementCard
                movement={item.item}
                unit={ingredient.baseUnit}
              />
            )
          }
          ListHeaderComponent={
            <>
              {model.ingredient.isError && (
                <ErrorState
                  message={stockError(model.ingredient.error)}
                  stale
                  busy={model.ingredient.isFetching}
                  onRetry={() => void model.refresh()}
                />
              )}
              <View style={s.overview}>
                <View style={s.overviewTop}>
                  <View style={s.icon}>
                    <Ionicons name="cube-outline" size={27} color={'#236347'} />
                  </View>
                  <StatusBadge
                    label={
                      !ingredient.isActive
                        ? 'Ngừng dùng'
                        : ingredient.isLowStock
                          ? 'Sắp hết'
                          : 'Còn hàng'
                    }
                    tone={
                      !ingredient.isActive
                        ? 'gray'
                        : ingredient.isLowStock
                          ? 'amber'
                          : 'green'
                    }
                  />
                </View>
                <Text style={s.name}>{ingredient.ingredientName}</Text>
                <Text selectable style={s.code}>
                  {ingredient.ingredientCode}
                </Text>
                <View style={s.stockStats}>
                  <View style={s.stat}>
                    <Text style={s.statLabel}>Tồn hiện tại</Text>
                    <Text style={s.stockValue}>
                      {formatQuantity(ingredient.stockQuantity)}{' '}
                      <Text style={s.unit}>{ingredient.baseUnit}</Text>
                    </Text>
                  </View>
                  <View style={[s.stat, s.minimum]}>
                    <Text style={s.statLabel}>Tồn tối thiểu</Text>
                    <Text style={s.minimumValue}>
                      {formatQuantity(ingredient.lowStockThreshold)}{' '}
                      <Text style={s.unit}>{ingredient.baseUnit}</Text>
                    </Text>
                  </View>
                </View>
                {ingredient.isActive && ingredient.isLowStock && (
                  <View style={s.lowNotice}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={17}
                      color={'#A76A1B'}
                    />
                    <Text style={s.lowText}>
                      Tồn kho đã chạm mức tối thiểu. Cần nhập bổ sung.
                    </Text>
                  </View>
                )}
              </View>
              <View style={s.tabs}>
                {(['lots', 'history'] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: model.tab === tab }}
                    accessibilityLabel={tab === 'lots' ? 'Lô hàng' : 'Lịch sử'}
                    onPress={() => model.setTab(tab)}
                    style={[s.tab, model.tab === tab && s.selectedTab]}
                  >
                    <Ionicons
                      name={tab === 'lots' ? 'layers-outline' : 'time-outline'}
                      size={18}
                      color={model.tab === tab ? '#236347' : '#738078'}
                    />
                    <Text
                      style={[
                        s.tabText,
                        model.tab === tab && { color: '#236347' },
                      ]}
                    >
                      {tab === 'lots' ? 'Lô hàng' : 'Lịch sử'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={s.sectionHeading}>
                <Text style={s.sectionTitle}>
                  {model.tab === 'lots'
                    ? 'Danh sách lô hàng'
                    : 'Biến động tồn kho'}{' '}
                  <Text style={s.total}>
                    {active.data
                      ? '(' +
                        formatQuantity(active.data.pages[0].totalCount) +
                        ')'
                      : ''}
                  </Text>
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tải lại nguyên liệu"
                  disabled={active.isFetching || model.ingredient.isFetching}
                  onPress={() => void model.refresh()}
                  style={s.refresh}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={'#236347'}
                  />
                </Pressable>
              </View>
              {active.isError && (
                <ErrorState
                  message={stockError(active.error)}
                  stale={data.length > 0}
                  busy={active.isFetching}
                  onRetry={() => void active.refetch()}
                />
              )}
            </>
          }
          ListEmptyComponent={
            active.isPending ? (
              <Loading />
            ) : active.isSuccess ? (
              <EmptyState
                title={
                  model.tab === 'lots' ? 'Chưa có lô hàng' : 'Chưa có biến động'
                }
              >
                {model.tab === 'lots'
                  ? 'Lô hàng sẽ xuất hiện sau khi xác nhận phiếu nhập kho.'
                  : 'Các lần nhập và sử dụng nguyên liệu sẽ hiển thị tại đây.'}
              </EmptyState>
            ) : null
          }
          ListFooterComponent={
            active.hasNextPage ? (
              <LoadMoreButton
                busy={active.isFetching}
                onPress={() => void active.fetchNextPage()}
              />
            ) : null
          }
        />
      )}
    </InventoryLayout>
  );
}
const s = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  overview: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4EBE6',
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF5ED',
  },
  name: {
    color: '#23382D',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 14,
    lineHeight: 31,
  },
  code: { color: '#738078', fontSize: 10, marginTop: 7 },
  stockStats: {
    flexDirection: 'row',
    marginTop: 18,
    padding: 16,
    backgroundColor: '#F1F6F0',
    borderRadius: 15,
  },
  stat: { flex: 1, minWidth: 0 },
  minimum: { borderLeftWidth: 1, borderColor: '#E4EBE6', paddingLeft: 18 },
  statLabel: { color: '#738078', fontSize: 11 },
  stockValue: {
    color: '#236347',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  minimumValue: {
    color: '#23382D',
    fontSize: 23,
    fontWeight: '600',
    marginTop: 11,
  },
  unit: { color: '#738078', fontSize: 12, fontWeight: '400' },
  lowNotice: {
    backgroundColor: '#FFF5E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  lowText: { flex: 1, fontSize: 12, color: '#A76A1B', lineHeight: 19 },
  tabs: {
    flexDirection: 'row',
    padding: 5,
    backgroundColor: '#E8EEE9',
    borderRadius: 15,
    marginTop: 18,
  },
  tab: {
    flex: 1,
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 11,
  },
  selectedTab: { backgroundColor: '#fff' },
  tabText: { color: '#738078', fontSize: 13, fontWeight: '600' },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: { color: '#23382D', fontSize: 15, fontWeight: '700' },
  total: { color: '#738078', fontSize: 12, fontWeight: '400' },
  refresh: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
