import type { WaiterState } from '../../shared/types/types';
import { hasWaiterSession } from '../../auth/utils/session';

export type KitchenReadyEvent = {
  tableId: string;
  itemId: string;
  quantity: number;
  note: string;
};

// Demo boundary for a future authenticated kitchen event transport.
// The original OrderItem model has one status for the entire line.
export function receiveKitchenReady(
  state: WaiterState,
  event: KitchenReadyEvent,
  now: number,
): string | null {
  if (!hasWaiterSession(state))
    return 'Vui lòng vào phiên phục vụ trước khi nhận thông báo.';
  if (!Number.isFinite(now) || typeof event.note !== 'string')
    return 'Nội dung thông báo từ bếp không hợp lệ.';
  const item = state.items.find((i) => i.id === event.itemId);
  const table = state.tables.find((t) => t.id === event.tableId);
  const session = state.sessions.find((s) => s.id === item?.sessionId);
  if (
    !item ||
    !session ||
    !table?.active ||
    table.sessionId !== item.sessionId ||
    session.tableId !== table.id
  )
    return 'Món hoặc phiên bàn không còn hợp lệ.';
  if (!Number.isInteger(event.quantity) || event.quantity !== item.quantity)
    return 'Số lượng món sẵn sàng không khớp với lượt gọi.';
  // Retries must not resurrect a seen notification or reset partial serving.
  if (item.status === 'Ready' || item.status === 'Served') return null;
  if (
    item.status !== 'Cooking' &&
    item.status !== 'Pending' &&
    item.status !== 'Sent'
  )
    return 'Không thể nhận thông báo cho món đã hủy.';
  item.status = 'Ready';
  item.readyAt = now;
  item.note = event.note.trim();
  item.seen = false;
  return null;
}
