import type { Reservation, ReservationStatus } from '../types/types';

export const reservationTabs: Record<string, ReservationStatus> = {
  'Chờ duyệt': 'Pending',
  'Đã xác nhận': 'Confirmed',
  'Đã đến': 'CheckedIn',
  'Từ chối': 'Rejected',
  'Đã hủy': 'Cancelled',
  'Hết hạn': 'Expired',
  'Không đến': 'NoShow',
};

export function reservationStatusLabel(status: ReservationStatus) {
  return (
    Object.keys(reservationTabs).find(
      (label) => reservationTabs[label] === status,
    ) ?? status
  );
}

export function reservationDateFields(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return {
    date: `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export function reservationStartAt(date: string, time: string): string | null {
  const day = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date.trim());
  const hour = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!day || !hour) return null;
  const [, d, m, y] = day.map(Number);
  const [, h, min] = hour.map(Number);
  if (y < 1900 || h > 23 || min > 59) return null;
  const value = new Date(y, m - 1, d, h, min);
  if (
    value.getFullYear() !== y ||
    value.getMonth() !== m - 1 ||
    value.getDate() !== d ||
    value.getHours() !== h ||
    value.getMinutes() !== min
  )
    return null;
  return value.toISOString();
}

export function reservationCanCheckIn(reservation: Reservation, now: number) {
  return (
    reservation.status === 'Confirmed' &&
    !!reservation.holdUntil &&
    now >= Date.parse(reservation.startAt) - 30 * 60000 &&
    now < Date.parse(reservation.holdUntil)
  );
}
