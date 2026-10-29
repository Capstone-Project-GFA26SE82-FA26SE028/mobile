export function receiptDate(value: string | null, dateOnly = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  const instant =
    dateOnly || /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : value + 'Z';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: dateOnly ? 'UTC' : 'Asia/Ho_Chi_Minh',
    ...(dateOnly ? {} : { hour: '2-digit', minute: '2-digit' }),
  }).format(new Date(instant));
}
