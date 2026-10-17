import type { Reservation, WaiterState } from '../shared/types';

export const holdStartsAt = (reservation: Reservation) => reservation.time - 30 * 60000;
export const validTimeSlot = (reservation: Reservation) =>
  Number.isFinite(reservation.time) && Number.isFinite(reservation.endTime) &&
  reservation.endTime > reservation.time;

export const inHoldWindow = (reservation: Reservation, now: number) =>
  validTimeSlot(reservation) && now >= holdStartsAt(reservation) && now < reservation.endTime;

// TimeSlot comes from each booking; no assumed dining/turnover duration.
export function reservationTableError(state: WaiterState, reservation: Reservation, tableId: string, now: number): string | null {
  if (!validTimeSlot(reservation) || !Number.isInteger(reservation.guests) || reservation.guests < 1)
    return 'Khung giờ hoặc số khách đặt bàn không hợp lệ.';
  if (reservation.time < now)
    return 'Giờ hẹn đã qua. Cần liên hệ khách trước khi duyệt.';
  const table = state.tables.find((t) => t.id === tableId);
  if (!table?.active || !table.area || table.needsCleaning || table.sessionId)
    return 'Chỉ được duyệt vào bàn đang trống, sạch và hoạt động.';
  if (table.capacity < reservation.guests)
    return 'Bàn không đủ chỗ cho số khách đặt trước.';
  if (state.reservations.some((r) => r.id !== reservation.id && r.status === 'confirmed' && r.tableId === tableId &&
    (!validTimeSlot(r) || (holdStartsAt(reservation) < r.endTime && holdStartsAt(r) < reservation.endTime))))
    return 'Bàn đã có lịch đặt hoặc giữ chỗ trùng khung giờ này.';
  return null;
}
