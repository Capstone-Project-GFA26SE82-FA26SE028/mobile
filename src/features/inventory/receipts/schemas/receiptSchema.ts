import type { ReceiptDraftLine, ReceiptRequest } from '../types/types';

const maximum = 999999999999999999n;
function scaled(value: string): bigint | null {
  const text = value.trim().replace(',', '.');
  if (!/^\d{1,12}(\.\d{1,6})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'));
}
export function receiptQuantity(value: string, factor = 1) {
  const raw = scaled(value);
  if (raw === null || raw <= 0n || raw > maximum) return null;
  const number = Number(value.trim().replace(',', '.'));
  // Avoid silently rounding decimal(18,6) quantities when serializing JSON numbers.
  if (scaled(number.toFixed(6)) !== raw) return null;
  const conversion = scaled(factor.toFixed(6));
  if (conversion === null || conversion <= 0n) return null;
  const product = raw * conversion;
  if (product % 1000000n || product / 1000000n > maximum) return null;
  return number;
}
export function receiptExpiry(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  if (Number(year) < 1) return null;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(iso + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === iso
    ? iso
    : null;
}
export function updateReceiptExpiry(
  value: string,
  part: number,
  input: string,
) {
  const pieces = value.split('/');
  const parts = [pieces[0] || '', pieces[1] || '', pieces[2] || ''];
  parts[part] = input.replace(/\D/g, '').slice(0, part === 2 ? 4 : 2);
  if (parts[1].length === 2)
    parts[1] = String(Math.min(12, Math.max(1, Number(parts[1])))).padStart(
      2,
      '0',
    );
  if (parts[0].length === 2) {
    const year = parts[2].length === 4 ? Number(parts[2]) : 2000;
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const maximumDay = parts[1].length === 2 ? days[Number(parts[1]) - 1] : 31;
    parts[0] = String(
      Math.min(maximumDay, Math.max(1, Number(parts[0]))),
    ).padStart(2, '0');
  }
  return parts.join('/');
}
export function buildReceipt(
  id: string,
  lines: ReceiptDraftLine[],
  note: string,
): ReceiptRequest {
  if (!lines.length || lines.length > 100)
    throw new Error('Chọn từ 1 đến 100 dòng nguyên liệu.');
  if (note.trim().length > 1000) throw new Error('Ghi chú tối đa 1.000 ký tự.');
  const seen = new Set<string>();
  const items = lines.map((line, index) => {
    if (!line.ingredient.isActive)
      throw new Error(`Dòng ${index + 1}: nguyên liệu đã ngừng sử dụng.`);
    const quantity = receiptQuantity(line.quantity, line.factor);
    if (quantity === null)
      throw new Error(
        `Dòng ${index + 1}: số lượng phải dương, tối đa 6 chữ số thập phân và quy đổi không được làm tròn hoặc vượt giới hạn.`,
      );
    const expiry = receiptExpiry(line.expiry);
    if (!expiry)
      throw new Error(
        `Dòng ${index + 1}: nhập hạn sử dụng hợp lệ theo ngày/tháng/năm.`,
      );
    const key = line.ingredient.ingredientId.toLowerCase() + ':' + expiry;
    if (seen.has(key))
      throw new Error(
        `Dòng ${index + 1}: trùng nguyên liệu và hạn sử dụng. Hãy gộp số lượng.`,
      );
    seen.add(key);
    return {
      ingredientId: line.ingredient.ingredientId,
      unitId: line.unitId,
      receivedQuantity: quantity,
      expiryDate: expiry,
    };
  });
  return { goodsReceiptId: id, note: note.trim(), items };
}
