import { stockError } from '../api/stockApi';
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
import InventoryLayout from '../../../../layouts/inventory/InventoryLayout';
import { useStock } from '../hooks/useStock';
import { IngredientCard } from '../components/IngredientCard';
import { LoadMoreButton } from '../../../../components/LoadMoreButton/LoadMoreButton';
import { formatQuantity } from '../utils/formatQuantity';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { Loading } from '../../../../components/Loading/Loading';
import type { StockFilter } from '../types/types';

const filters: { key: StockFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'low', label: 'Sắp hết' },
  { key: 'inactive', label: 'Ngừng dùng' },
];

export default function StockListScreen() {
  const model = useStock();
  const router = useRouter();
  const wide = useWindowDimensions().width >= 768;
  const { ingredients, counts } = model;
  return (
    <InventoryLayout>
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
                  <Text style={s.heroCaption}>KHO NGUYÊN LIỆU</Text>
                  <Text style={s.title}>Tổng quan tồn kho</Text>
                </View>
                <View style={s.heroIcon}>
                  <Ionicons name="layers-outline" size={24} color="#C6DBBF" />
                </View>
              </View>
              <View style={s.stats}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xem tất cả nguyên liệu"
                  onPress={() => {
                    model.setSearch('');
                    model.setFilter('all');
                  }}
                  style={s.stat}
                >
                  <Text style={s.statValue}>
                    {counts.data && !counts.isError
                      ? formatQuantity(counts.data.all)
                      : '—'}
                  </Text>
                  <Text style={s.statLabel}>Tổng nguyên liệu</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xem nguyên liệu sắp hết"
                  onPress={() => {
                    model.setSearch('');
                    model.setFilter('low');
                  }}
                  style={[s.stat, s.lowStat]}
                >
                  <View style={s.row}>
                    <Text style={[s.statValue, { color: '#F4D69A' }]}>
                      {counts.data && !counts.isError
                        ? formatQuantity(counts.data.low)
                        : '—'}
                    </Text>
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color="#F4D69A"
                    />
                  </View>
                  <Text style={s.statLabel}>Sắp hết</Text>
                </Pressable>
              </View>
            </View>
            {counts.isError && (
              <ErrorState
                message={stockError(counts.error)}
                busy={counts.isFetching}
                onRetry={() => void counts.refetch()}
              />
            )}
            <View style={s.search}>
              <Ionicons name="search-outline" size={20} color="#8C9B90" />
              <TextInput
                accessibilityLabel="Tìm nguyên liệu"
                placeholder="Tìm tên hoặc mã nguyên liệu…"
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
                  accessibilityLabel="Xóa tìm kiếm"
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
                Nguyên liệu{' '}
                <Text style={s.count}>
                  {model.total === undefined
                    ? ''
                    : '(' + formatQuantity(model.total) + ')'}
                </Text>
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tải lại tồn kho"
                disabled={ingredients.isFetching || counts.isFetching}
                onPress={() => void model.refresh()}
                style={s.refresh}
              >
                <Ionicons name="refresh-outline" size={17} color={'#236347'} />
                <Text style={{ fontSize: 12, color: '#236347' }}>Tải lại</Text>
              </Pressable>
            </View>
            {ingredients.isError && (
              <ErrorState
                message={stockError(ingredients.error)}
                stale={model.items.length > 0}
                busy={ingredients.isFetching}
                onRetry={() => void ingredients.refetch()}
              />
            )}
          </>
        }
        ListEmptyComponent={
          ingredients.isPending ? (
            <Loading />
          ) : ingredients.isSuccess ? (
            <EmptyState
              title={
                model.search.trim()
                  ? 'Không tìm thấy nguyên liệu phù hợp'
                  : model.filter === 'low'
                    ? 'Không có nguyên liệu sắp hết'
                    : 'Chưa có nguyên liệu'
              }
            >
              {model.search.trim()
                ? 'Thử tìm bằng tên hoặc mã nguyên liệu khác.'
                : model.filter === 'low'
                  ? 'Các nguyên liệu đang dùng đều có tồn kho trên mức tối thiểu.'
                  : 'Nguyên liệu do quản lý thêm sẽ hiển thị tại đây.'}
            </EmptyState>
          ) : null
        }
        ListFooterComponent={
          ingredients.hasNextPage ? (
            <LoadMoreButton
              busy={ingredients.isFetching}
              onPress={() => void ingredients.fetchNextPage()}
            />
          ) : null
        }
      />
    </InventoryLayout>
  );
}
const s = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  hero: {
    backgroundColor: '#153F30',
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
    borderColor: '#E4EBE6',
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
    color: '#23382D',
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
  activeChip: { backgroundColor: '#236347' },
  chipLabel: { color: '#738078', fontSize: 12, fontWeight: '600' },
  listHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: { color: '#23382D', fontSize: 16, fontWeight: '700' },
  count: { fontWeight: '400', color: '#738078', fontSize: 13 },
  refresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 40,
    paddingLeft: 12,
  },
});
