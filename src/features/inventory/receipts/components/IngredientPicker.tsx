import { ErrorState } from '../../../../components/ErrorState/ErrorState';
import { Loading } from '../../../../components/Loading/Loading';
import { EmptyState } from '../../../../components/EmptyState/EmptyState';
import { LoadMoreButton } from '../../../../components/LoadMoreButton/LoadMoreButton';
import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppSelector } from '../../../../app/hooks';
import { getReceiptIngredients, receiptError } from '../api/receiptApi';
import type { ReceiptIngredient } from '../types/types';

export function IngredientPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (item: ReceiptIngredient) => void;
}) {
  const user = useAppSelector((s) => s.auth.user);
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useInfiniteQuery({
    queryKey: ['inventory-receipt-ingredients', user?.id, term],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getReceiptIngredients(pageParam, term, signal),
    getNextPageParam: (page) =>
      page.page * page.pageSize < page.totalCount ? page.page + 1 : undefined,
    retry: false,
  });
  const items = [
    ...new Map(
      query.data?.pages
        .flatMap((p) => p.items)
        .filter((i) => i.isActive)
        .map((i) => [i.ingredientId, i]),
    ).values(),
  ];
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={r.page}>
        <View style={r.header}>
          <Text style={[r.title, { flex: 1 }]}>Chọn nguyên liệu</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng"
            onPress={onClose}
            style={r.icon}
          >
            <Ionicons name="close" size={23} color={'#23382D'} />
          </Pressable>
        </View>
        <FlatList
          data={items}
          keyExtractor={(i) => i.ingredientId}
          contentContainerStyle={r.content}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: 12 }}>
              <TextInput
                accessibilityLabel="Tìm nguyên liệu"
                placeholder="Tên hoặc mã nguyên liệu"
                value={search}
                onChangeText={setSearch}
                maxLength={255}
                style={r.input}
              />
              {query.isError && (
                <ErrorState
                  message={receiptError(query.error)}
                  onRetry={() => void query.refetch()}
                />
              )}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(item)}
              style={[r.card, r.row]}
            >
              <View style={{ flex: 1 }}>
                <Text style={r.heading}>{item.ingredientName}</Text>
                <Text style={r.muted}>
                  {item.ingredientCode} · {item.baseUnit}
                </Text>
              </View>
              <Ionicons name="add-circle-outline" size={24} color={'#236347'} />
            </Pressable>
          )}
          ListEmptyComponent={
            query.isPending ? (
              <Loading />
            ) : !query.isError ? (
              <EmptyState title="Không có nguyên liệu đang hoạt động" />
            ) : null
          }
          ListFooterComponent={
            query.hasNextPage ? (
              <LoadMoreButton
                busy={query.isFetchingNextPage}
                onPress={() => void query.fetchNextPage()}
              />
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const r = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F7F5' },
  content: {
    padding: 18,
    paddingTop: 8,
    gap: 14,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#153F30',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  icon: {
    width: 42,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E7EDE8',
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
  input: {
    borderWidth: 1,
    borderColor: '#E4EBE6',
    backgroundColor: '#F6F9F6',
    padding: 14,
    minHeight: 50,
    borderRadius: 14,
    color: '#23382D',
    fontSize: 15,
  },
  muted: { color: '#738078', fontSize: 13, lineHeight: 20 },
  heading: { fontSize: 16, color: '#23382D', fontWeight: '700' },
});
