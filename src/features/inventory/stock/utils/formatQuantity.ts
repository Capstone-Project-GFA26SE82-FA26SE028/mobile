export const formatQuantity = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 6 }).format(value);
