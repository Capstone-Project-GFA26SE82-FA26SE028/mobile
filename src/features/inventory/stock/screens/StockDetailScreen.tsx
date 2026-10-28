import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStockDetail } from '../hooks/useStock';
import {
  InventoryHeader,
  LoadMore,
  quantity,
  StockBadge,
  StockEmpty,
  StockError,
  StockLoading,
  stockColors as c,
} from '../components/StockUI';
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
  const router = useRouter();
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
  const back = () =>
    router.canGoBack() ? router.back() : router.replace('/inventory');
  return (
    <SafeAreaView style={s.page}>
      <InventoryHeader onBack={back} />
      {!model.validId ? (
        <View style={s.content}>
          <StockEmpty title="Invalid ingredient">
            Go back to inventory and select an ingredient.
          </StockEmpty>
        </View>
      ) : model.ingredient.isPending ? (
        <StockLoading />
      ) : !ingredient ? (
        <View style={s.content}>
          <StockError
            error={model.ingredient.error}
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
                <StockError
                  error={model.ingredient.error}
                  stale
                  busy={model.ingredient.isFetching}
                  onRetry={() => void model.refresh()}
                />
              )}
              <View style={s.overview}>
                <View style={s.overviewTop}>
                  <View style={s.icon}>
                    <Ionicons name="cube-outline" size={27} color={c.green} />
                  </View>
                  <StockBadge
                    label={
                      !ingredient.isActive
                        ? 'Inactive'
                        : ingredient.isLowStock
                          ? 'Low stock'
                          : 'In stock'
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
                    <Text style={s.statLabel}>On hand</Text>
                    <Text style={s.stockValue}>
                      {quantity(ingredient.stockQuantity)}{' '}
                      <Text style={s.unit}>{ingredient.baseUnit}</Text>
                    </Text>
                  </View>
                  <View style={[s.stat, s.minimum]}>
                    <Text style={s.statLabel}>Minimum stock</Text>
                    <Text style={s.minimumValue}>
                      {quantity(ingredient.lowStockThreshold)}{' '}
                      <Text style={s.unit}>{ingredient.baseUnit}</Text>
                    </Text>
                  </View>
                </View>
                {ingredient.isActive && ingredient.isLowStock && (
                  <View style={s.lowNotice}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={17}
                      color={c.amber}
                    />
                    <Text style={s.lowText}>
                      At or below minimum stock. Plan a replenishment.
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
                    accessibilityLabel={tab === 'lots' ? 'Lots' : 'History'}
                    onPress={() => model.setTab(tab)}
                    style={[s.tab, model.tab === tab && s.selectedTab]}
                  >
                    <Ionicons
                      name={tab === 'lots' ? 'layers-outline' : 'time-outline'}
                      size={18}
                      color={model.tab === tab ? c.green : c.muted}
                    />
                    <Text
                      style={[
                        s.tabText,
                        model.tab === tab && { color: c.green },
                      ]}
                    >
                      {tab === 'lots' ? 'Lots' : 'History'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={s.sectionHeading}>
                <Text style={s.sectionTitle}>
                  {model.tab === 'lots' ? 'Stock lots' : 'Stock movements'}{' '}
                  <Text style={s.total}>
                    {active.data
                      ? '(' + quantity(active.data.pages[0].totalCount) + ')'
                      : ''}
                  </Text>
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Refresh ingredient"
                  disabled={active.isFetching || model.ingredient.isFetching}
                  onPress={() => void model.refresh()}
                  style={s.refresh}
                >
                  <Ionicons name="refresh-outline" size={18} color={c.green} />
                </Pressable>
              </View>
              {active.isError && (
                <StockError
                  error={active.error}
                  stale={data.length > 0}
                  busy={active.isFetching}
                  onRetry={() => void active.refetch()}
                />
              )}
            </>
          }
          ListEmptyComponent={
            active.isPending ? (
              <StockLoading />
            ) : active.isSuccess ? (
              <StockEmpty
                title={
                  model.tab === 'lots'
                    ? 'No stock lots yet'
                    : 'No movements yet'
                }
              >
                {model.tab === 'lots'
                  ? 'Lots appear after a goods receipt is confirmed.'
                  : 'Confirmed receipts and stock usage will appear here.'}
              </StockEmpty>
            ) : null
          }
          ListFooterComponent={
            active.hasNextPage ? (
              <LoadMore
                busy={active.isFetching}
                onPress={() => void active.fetchNextPage()}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.bg },
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
    borderColor: c.line,
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
    color: c.ink,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 14,
    lineHeight: 31,
  },
  code: { color: c.muted, fontSize: 10, marginTop: 7 },
  stockStats: {
    flexDirection: 'row',
    marginTop: 18,
    padding: 16,
    backgroundColor: '#F1F6F0',
    borderRadius: 15,
  },
  stat: { flex: 1, minWidth: 0 },
  minimum: { borderLeftWidth: 1, borderColor: c.line, paddingLeft: 18 },
  statLabel: { color: c.muted, fontSize: 11 },
  stockValue: { color: c.green, fontSize: 28, fontWeight: '700', marginTop: 8 },
  minimumValue: {
    color: c.ink,
    fontSize: 23,
    fontWeight: '600',
    marginTop: 11,
  },
  unit: { color: c.muted, fontSize: 12, fontWeight: '400' },
  lowNotice: {
    backgroundColor: '#FFF5E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  lowText: { flex: 1, fontSize: 12, color: c.amber, lineHeight: 19 },
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
  tabText: { color: c.muted, fontSize: 13, fontWeight: '600' },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: { color: c.ink, fontSize: 15, fontWeight: '700' },
  total: { color: c.muted, fontSize: 12, fontWeight: '400' },
  refresh: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
