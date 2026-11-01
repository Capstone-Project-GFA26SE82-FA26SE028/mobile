import { useMutation, useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/app/hooks';
import { reservationApi } from '../api/reservationApi';
import {
  useRefreshWaiterData,
  useWaiterScope,
} from '../../shared/hooks/useWaiterScope';
import type {
  AvailabilityQuery,
  ReservationAction,
  ReservationStatus,
} from '../types/types';

export function useReservations(status: ReservationStatus) {
  const scope = useWaiterScope();
  const enabled = useAppSelector(
    (s) => s.waiter.authMode === 'api' && s.waiter.signedIn,
  );
  return useQuery({
    queryKey: [...scope, 'reservations', status],
    queryFn: ({ signal }) => reservationApi.list(status, signal),
    enabled,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useReservation(id: string) {
  const scope = useWaiterScope();
  return useQuery({
    queryKey: [...scope, 'reservation', id],
    queryFn: ({ signal }) => reservationApi.detail(id, signal),
    enabled: !!id,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useReservationAvailability(params: AvailabilityQuery | null) {
  const scope = useWaiterScope();
  return useQuery({
    queryKey: [...scope, 'reservation-availability', params],
    queryFn: ({ signal }) => reservationApi.availability(params!, signal),
    enabled: !!params,
    staleTime: 0,
    refetchInterval: 5000,
    retry: 1,
  });
}

export function useReservationAction() {
  const refresh = useRefreshWaiterData();
  return useMutation({
    mutationFn: (request: ReservationAction) => reservationApi.act(request),
    // Conflicts can expire a reservation or record NoShow on the server.
    onSettled: refresh,
    retry: false,
  });
}
