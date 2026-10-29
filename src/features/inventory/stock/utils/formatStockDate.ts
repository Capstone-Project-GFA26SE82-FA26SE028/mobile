export function formatStockDate(value: string | null, dateOnly = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Chưa có';
  const parts = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: dateOnly ? 'UTC' : 'Asia/Ho_Chi_Minh',
    ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit' }),
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || '';
  const date = `${part('day')}/${part('month')}/${part('year')}`;
  return dateOnly ? date : `${date}, ${part('hour')}:${part('minute')}`;
}
