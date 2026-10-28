import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStock } from '../hooks/useStock';
import { IngredientCard } from '../components/IngredientCard';
import {
  InventoryHeader,
  LoadMore,
  quantity,
  StockEmpty,
  StockError,
  StockLoading,
  stockColors as c,
} from '../components/StockUI';
import type { StockFilter } from '../types/types';

const filters: { key: StockFilter; label: string }[] = [
  { key: 'all', label: 'All items' },
  { key: 'low', label: 'Low stock' },
  { key: 'inactive', label: 'Inactive' },
];

export default function StockListScreen() {
  const model = useStock();
  const router = useRouter();
  const wide = useWindowDimensions().width >= 768;
  const { ingredients, counts } = model;
  return (
    <SafeAreaView style={s.page}>
      <InventoryHeader />
      <FlatList
        key={wide ? 'wide' : 'phone'}
        numColumns={wide ? 2 : 1}
        data={model.items}
        keyExtractor={(item) => item.ingredientId}
        contentContainerStyle={s.content}
        columnWrapperStyle={wide ? { gap: 12 } : undefined}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={ingredients.isRefetching && !ingredients.isFetchingNextPage}
        onRefresh={() => void model.refresh()}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <IngredientCard
              ingredient={item}
              onPress={() =>
                router.push({
                  pathname: '/inventory-detail',
                  params: { id: item.ingredientId },
                })
              }
            />
          </View>
        )}
        ListHeaderComponent={
          <>
            <View style={s.hero}>
              <View pointerEvents="none" style={s.heroGlow} />
              <View style={s.heroTitleRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.heroCaption}>INVENTORY</Text>
                  <Text style={s.title}>Stock overview</Text>
                </View>
                <View style={s.heroIcon}>
                  <Ionicons name="layers-outline" size={24} color="#C6DBBF" />
                </View>
              </View>
              <View style={s.stats}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Show all ingredients"
                  onPress={() => {
                    model.setSearch('');
                    model.setFilter('all');
                  }}
                  style={s.stat}
                >
                  <Text style={s.statValue}>
                    {counts.data && !counts.isError
                      ? quantity(counts.data.all)
                      : '—'}
                  </Text>
                  <Text style={s.statLabel}>Total ingredients</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Show low stock"
                  onPress={() => {
                    model.setSearch('');
                    model.setFilter('low');
                  }}
                  style={[s.stat, s.lowStat]}
                >
                  <View style={s.row}>
                    <Text style={[s.statValue, { color: '#F4D69A' }]}>
                      {counts.data && !counts.isError
                        ? quantity(counts.data.low)
                        : '—'}
                    </Text>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#F4D69A"
                    />
                  </View>
                  <Text style={s.statLabel}>Low stock</Text>
                </Pressable>
              </View>
            </View>
            {counts.isError && (
              <StockError
                error={counts.error}
                busy={counts.isFetching}
                onRetry={() => void counts.refetch()}
              />
            )}
            <View style={s.search}>
              <Ionicons name="search-outline" size={20} color="#8C9B90" />
              <TextInput
                accessibilityLabel="Search ingredients"
                placeholder="Search name or code..."
                placeholderTextColor="#8C9B90"
                value={model.search}
                onChangeText={model.setSearch}
                maxLength={255}
                autoCorrect={false}
                style={s.searchInput}
                returnKeyType="search"
              />
              {!!model.search && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  onPress={() => model.setSearch('')}
                  style={s.clear}
                >
                  <Ionicons name="close-circle" size={18} color="#8C9B90" />
                </Pressable>
              )}
            </View>
            <View style={s.filters}>
              {filters.map((filter) => (
                <Pressable
                  key={filter.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter.key === model.filter }}
                  onPress={() => model.setFilter(filter.key)}
                  style={[s.chip, filter.key === model.filter && s.activeChip]}
                >
                  <Text
                    style={[
                      s.chipLabel,
                      filter.key === model.filter && { color: '#fff' },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={s.listHeading}>
              <Text style={s.listTitle}>
                Ingredients{' '}
                <Text style={s.count}>
                  {model.total === undefined
                    ? ''
                    : '(' + quantity(model.total) + ')'}
                </Text>
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Refresh inventory"
                disabled={ingredients.isFetching || counts.isFetching}
                onPress={() => void model.refresh()}
                style={s.refresh}
              >
                <Ionicons name="refresh-outline" size={17} color={c.green} />
                <Text style={{ fontSize: 12, color: c.green }}>Refresh</Text>
              </Pressable>
            </View>
            {ingredients.isError && (
              <StockError
                error={ingredients.error}
                stale={model.items.length > 0}
                busy={ingredients.isFetching}
                onRetry={() => void ingredients.refetch()}
              />
            )}
          </>
        }
        ListEmptyComponent={
          ingredients.isPending ? (
            <StockLoading />
          ) : ingredients.isSuccess ? (
            <StockEmpty
              title={
                model.search.trim()
                  ? 'No matching ingredients'
                  : model.filter === 'low'
                    ? 'No low-stock ingredients'
                    : 'No ingredients found'
              }
            >
              {model.search.trim()
                ? 'Try a different name or ingredient code.'
                : model.filter === 'low'
                  ? 'Active ingredients are above their minimum stock levels.'
                  : 'Ingredients added by your manager will appear here.'}
            </StockEmpty>
          ) : null
        }
        ListFooterComponent={
          ingredients.hasNextPage ? (
            <LoadMore
              busy={ingredients.isFetching}
              onPress={() => void ingredients.fetchNextPage()}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.bg },
  content: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: c.dark,
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -80,
    top: -100,
    backgroundColor: 'rgba(184, 223, 141, 0.07)',
  },
  heroIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroCaption: {
    color: '#AAC5B2',
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 5,
    letterSpacing: -0.5,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stats: {
    flexDirection: 'row',
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 16,
  },
  stat: {
    flex: 1,
  },
  lowStat: {
    borderLeftWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingLeft: 20,
  },
  statValue: { color: '#fff', fontSize: 28, fontWeight: '700' },
  statLabel: { color: '#CBDBCF', fontSize: 11, marginTop: 4 },
  search: {
    minHeight: 48,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 10,
    fontSize: 14,
    color: c.ink,
  },
  clear: { padding: 12 },
  filters: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
    marginBottom: 14,
    padding: 4,
    borderRadius: 14,
    backgroundColor: '#E8EEE9',
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  activeChip: { backgroundColor: c.green },
  chipLabel: { color: c.muted, fontSize: 12, fontWeight: '600' },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: { color: c.ink, fontSize: 16, fontWeight: '700' },
  count: { fontWeight: '400', color: c.muted, fontSize: 13 },
  refresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 40,
    paddingLeft: 12,
  },
});
