import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../../../../app/hooks';
import {
  getIngredient,
  getIngredients,
  getStockCounts,
  getStockLots,
  getStockMovements,
} from '../api/stockApi';
import type { StockFilter, StockPage } from '../types/types';

function nextPage<T>(page: StockPage<T>) {
  return page.page * page.pageSize < page.totalCount
    ? page.page + 1
    : undefined;
}

export function useStock() {
  const user = useAppSelector((state) => state.auth.user);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const enabled = user?.role === 'inventory';
  const ingredients = useInfiniteQuery({
    queryKey: ['inventory-stock', user?.id, 'list', debounced, filter],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getIngredients(pageParam, debounced, filter, signal),
    getNextPageParam: nextPage,
    enabled,
    retry: false,
    staleTime: 15000,
    refetchInterval: 30000,
  });
  const counts = useQuery({
    queryKey: ['inventory-stock', user?.id, 'counts'],
    queryFn: ({ signal }) => getStockCounts(signal),
    enabled,
    retry: false,
    staleTime: 15000,
    refetchInterval: 30000,
  });
  const items = [
    ...new Map(
      ingredients.data?.pages
        .flatMap((page) => page.items)
        .map((item) => [item.ingredientId, item]),
    ).values(),
  ];
  return {
    search,
    setSearch,
    filter,
    setFilter,
    ingredients,
    counts,
    items,
    total: ingredients.data?.pages[0]?.totalCount,
    async refresh() {
      await Promise.all([ingredients.refetch(), counts.refetch()]);
    },
  };
}

export function useStockDetail(id: string) {
  const user = useAppSelector((state) => state.auth.user);
  const [tab, setTab] = useState<'lots' | 'history'>('lots');
  const validId = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id);
  const enabled = user?.role === 'inventory' && validId;
  const key = ['inventory-stock', user?.id, 'ingredient', id];
  const ingredient = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getIngredient(id, signal),
    enabled,
    retry: false,
    staleTime: 15000,
    refetchInterval: 30000,
  });
  const lots = useInfiniteQuery({
    queryKey: [...key, 'lots'],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => getStockLots(id, pageParam, signal),
    getNextPageParam: nextPage,
    enabled: enabled && !!ingredient.data && tab === 'lots',
    retry: false,
    staleTime: 15000,
    refetchInterval: 30000,
  });
  const history = useInfiniteQuery({
    queryKey: [...key, 'history'],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      getStockMovements(id, pageParam, signal),
    getNextPageParam: nextPage,
    enabled: enabled && !!ingredient.data && tab === 'history',
    retry: false,
    staleTime: 15000,
    refetchInterval: 30000,
  });
  return {
    validId,
    tab,
    setTab,
    ingredient,
    lots,
    history,
    async refresh() {
      await Promise.all([
        ingredient.refetch(),
        tab === 'lots' ? lots.refetch() : history.refetch(),
      ]);
    },
  };
}
