import type { Command, DiningTable, Dish, WaiterState } from './types';
import { hasWaiterSession } from '../auth/session';
export const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
export const time = (n: number) =>
  new Date(n).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
export const minutes = (from: number, now: number) =>
  Math.max(0, Math.floor((now - from) / 60000));
export const matches = (value: string, query: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .includes(
      query
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .trim(),
    );
export const sessionTotal = (state: WaiterState, sessionId: string) =>
  state.items
    .filter((i) => i.sessionId === sessionId && i.status !== 'Cancelled')
    .reduce((sum, i) => sum + i.quantity * i.price, 0);
export const heldReservation = (
  state: WaiterState,
  tableId: string,
  now: number,
) =>
  state.reservations.find(
    (r) =>
      r.status === 'confirmed' &&
      r.tableId === tableId &&
      now >= r.time - 30 * 60000 &&
      now <= r.time + 15 * 60000,
  );
export function tableStatus(
  state: WaiterState,
  table: DiningTable,
  now: number,
) {
  if (table.needsCleaning) return 'Cần dọn';
  if (!table.sessionId)
    return heldReservation(state, table.id, now) ? 'Giữ chỗ' : 'Trống';
  if (
    state.items.some(
      (i) =>
        i.sessionId === table.sessionId &&
        i.status === 'Ready' &&
        i.served < i.quantity,
    )
  )
    return 'Chờ trả món';
  return 'Có khách';
}

// Pure validation/mutation boundary used by Redux and regression tests.
export function applyCommand(
  state: WaiterState,
  command: Command,
  menu: readonly Dish[],
): string | null {
  if (!hasWaiterSession(state) || !state.waiter)
    return 'Vui lòng vào phiên phục vụ hợp lệ trước khi thao tác.';
  const c = command;
  if (c.type === 'confirm-order') {
    const order = state.customerOrders.find((o) => o.id === c.orderId);
    if (!order || order.status !== 'awaiting_confirmation')
      return 'Đơn đã được xác nhận hoặc không còn tồn tại. Hãy kiểm tra lại danh sách.';
    if (order.version !== c.version)
      return 'Đơn vừa được cập nhật. Vui lòng đóng bảng xác nhận và kiểm tra lại nội dung mới.';
    if (!state.waiter.id.trim() || !state.waiter.name.trim())
      return 'Không tìm thấy thông tin nhân viên xác nhận.';
    const session = state.sessions.find((s) => s.id === order.sessionId);
    if (!session || !state.tables.some((t) => t.active && t.id === session.tableId && t.sessionId === session.id))
      return 'Phiên bàn đã đóng hoặc không còn hoạt động.';
    if (order.lines.some((line) => !Number.isSafeInteger(line.price) || line.price < 0 || !line.name.trim()))
      return 'Giá hoặc thông tin món trong đơn không hợp lệ. Vui lòng kiểm tra lại.';
    // Only accepted orders become kitchen items and enter the billable total.
    const error = applyCommand(state, {
      type: 'order', id: `customer-${order.id}`, now: c.now,
      sessionId: order.sessionId,
      lines: order.lines.map((line) => ({
        dishId: line.dishId, quantity: line.quantity,
        note: [line.note, order.note].filter(Boolean).join(' · '),
      })),
    }, menu);
    if (error) return error;
    // Keep the price/name reviewed with this order, even if the menu changes.
    // Availability and quantities were validated before any item was created.
    order.lines.forEach((line, index) => {
      const item = state.items.find((i) => i.id === `customer-${order.id}-${index}`)!;
      item.price = line.price;
      item.name = line.name;
    });
    order.status = 'confirmed';
    order.version += 1;
    order.confirmedBy = { id: state.waiter.id, name: state.waiter.name };
    order.confirmedAt = c.now;
    state.logs.unshift({
      id: c.id, time: c.now,
      text: `${state.waiter.name} xác nhận đơn ${order.id}, chuyển bếp và thu ngân.`,
    });
    return null;
  }
  if (c.type === 'open') {
    const table = state.tables.find((t) => t.id === c.tableId);
    if (
      !table ||
      !table.active ||
      !table.area ||
      table.sessionId ||
      table.needsCleaning
    )
      return 'Bàn chưa đủ điều kiện mở phiên.';
    if (
      !Number.isInteger(c.guests) ||
      c.guests < 1 ||
      c.guests > table.capacity
    )
      return `Số khách phải từ 1 đến ${table.capacity}.`;
    const hold = heldReservation(state, table.id, c.now);
    if (hold && hold.id !== c.reservationId)
      return 'Bàn đang giữ cho khách đặt trước. Hãy chọn bàn khác.';
    if (c.reservationId) {
      const r = state.reservations.find((r) => r.id === c.reservationId);
      if (!r || r.status !== 'confirmed' || r.tableId !== table.id)
        return 'Đặt bàn không còn hợp lệ.';
      if (c.now < r.time - 30 * 60000 || c.now > r.time + 15 * 60000)
        return 'Chỉ nhận khách trong khoảng giữ chỗ của đặt bàn.';
      r.status = 'arrived';
    }
    table.sessionId = c.id;
    state.sessions.push({
      id: c.id,
      tableId: table.id,
      guests: c.guests,
      openedAt: c.now,
      prebillPrinted: false,
      payment: 'unpaid',
    });
    state.logs.unshift({
      id: c.id,
      time: c.now,
      text: `Mở ${table.name} cho ${c.guests} khách.`,
    });
  } else if (c.type === 'move') {
    const session = state.sessions.find((s) => s.id === c.sessionId);
    const target = state.tables.find((t) => t.id === c.tableId);
    if (!session || session.prebillPrinted || session.payment !== 'unpaid')
      return 'Không đổi bàn khi đã in tạm tính hoặc đang xử lý thanh toán.';
    if (
      !target ||
      !target.active ||
      !target.area ||
      target.sessionId ||
      target.needsCleaning ||
      heldReservation(state, target.id, c.now)
    )
      return 'Bàn đích phải trống và không được giữ chỗ.';
    if (target.capacity < session.guests)
      return 'Bàn đích không đủ chỗ cho khách.';
    if (!c.reason.trim()) return 'Vui lòng nhập lý do đổi bàn.';
    const source = state.tables.find((t) => t.id === session.tableId);
    if (!source?.active || source.sessionId !== session.id)
      return 'Phiên bàn hiện tại không còn hoạt động.';
    if (c.sourceTableId !== undefined && c.sourceTableId !== source.id)
      return 'Bàn hiện tại vừa thay đổi. Vui lòng mở lại chi tiết bàn.';
    source.sessionId = null;
    source.needsCleaning = true;
    target.sessionId = session.id;
    session.tableId = target.id;
    state.logs.unshift({
      id: c.id,
      time: c.now,
      text: `${source.name} → ${target.name}. Lý do: ${c.reason.trim()}`,
    });
  } else if (c.type === 'order') {
    const session = state.sessions.find((s) => s.id === c.sessionId);
    if (
      !session ||
      session.payment !== 'unpaid' ||
      !state.tables.some((t) => t.active && t.id === session.tableId && t.sessionId === session.id)
    )
      return 'Phiên bàn không còn nhận món.';
    if (!c.lines.length) return 'Vui lòng chọn ít nhất một món.';
    if (state.items.some((i) => i.id.startsWith(c.id + '-')))
      return 'Lượt gọi món này đã được ghi nhận.';
    for (const line of c.lines) {
      if (
        !menu.some((d) => d.id === line.dishId && d.available) ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 99 ||
        typeof line.note !== 'string'
      )
        return 'Món hoặc số lượng không hợp lệ. Kiểm tra lại giỏ món.';
    }
    c.lines.forEach((line, index) => {
      const dish = menu.find((d) => d.id === line.dishId)!;
      state.items.push({
        id: `${c.id}-${index}`,
        sessionId: c.sessionId,
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: line.quantity,
        served: 0,
        note: line.note.trim(),
        status: 'Pending',
        seen: true,
      });
    });
    state.logs.unshift({
      id: c.id,
      time: c.now,
      text: `Thêm ${c.lines.reduce((n, l) => n + l.quantity, 0)} phần món vào phiên ${c.sessionId}.`,
    });
  } else if (c.type === 'cancel') {
    const item = state.items.find((i) => i.id === c.itemId);
    if (!item || (item.status !== 'Pending' && item.status !== 'Sent'))
      return 'Chỉ được hủy món chưa bắt đầu chế biến.';
    if (
      state.sessions.find((s) => s.id === item.sessionId)?.payment !== 'unpaid'
    )
      return 'Không hủy món trong phiên đang thanh toán.';
    if (!state.tables.some((t) => t.active && t.sessionId === item.sessionId))
      return 'Phiên bàn không còn hoạt động.';
    if (!c.reason.trim()) return 'Vui lòng nhập lý do hủy món.';
    item.status = 'Cancelled';
    state.logs.unshift({
      id: c.id,
      time: c.now,
      text: `Hủy ${item.quantity} × ${item.name}. Lý do: ${c.reason.trim()}`,
    });
  } else if (c.type === 'serve') {
    const item = state.items.find((i) => i.id === c.itemId);
    if (!item || item.status !== 'Ready')
      return 'Món chưa sẵn sàng để lên bàn.';
    if (!state.tables.some((t) => t.active && t.sessionId === item.sessionId))
      return 'Phiên bàn không còn hoạt động. Vui lòng kiểm tra lại.';
    if (item.servings?.some((s) => s.id === c.id))
      return 'Lượt lên món này đã được ghi nhận.';
    if (c.expectedServed !== undefined && c.expectedServed !== item.served)
      return 'Số phần đã lên vừa thay đổi. Vui lòng mở lại bảng xác nhận.';
    if (
      !Number.isInteger(c.quantity) ||
      c.quantity < 1 ||
      c.quantity > item.quantity - item.served
    )
      return 'Số phần đã lên không hợp lệ.';
    item.served += c.quantity;
    (item.servings ??= []).push({
      id: c.id, waiterId: state.waiter.id, waiterName: state.waiter.name,
      quantity: c.quantity, time: c.now,
    });
    item.seen = true;
    if (item.served === item.quantity) item.status = 'Served';
    state.logs.unshift({
      id: c.id,
      time: c.now,
      text: `${state.waiter.name} đã lên ${c.quantity} × ${item.name}.`,
    });
  } else if (c.type === 'seen') {
    const item = state.items.find((i) => i.id === c.itemId);
    if (item) item.seen = true;
  } else if (c.type === 'request') {
    const request = state.requests.find((r) => r.id === c.requestId);
    if (!request || request.status === 'done') return 'Yêu cầu đã được xử lý.';
    if (c.status === 'processing') {
      const first = state.requests
        .filter((r) => r.status === 'new')
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      if (request.status !== 'new' || first?.id !== request.id)
        return 'Hãy tiếp nhận yêu cầu đến trước trước khi xử lý yêu cầu này.';
    } else if (request.status !== 'processing')
      return 'Vui lòng tiếp nhận trước khi hoàn tất.';
    request.status = c.status;
    state.logs.unshift({
      id: c.id,
      time: c.now,
      text: `${c.status === 'done' ? 'Hoàn tất' : 'Tiếp nhận'}: ${request.type}.`,
    });
  } else if (c.type === 'collect') {
    const session = state.sessions.find((s) => s.id === c.sessionId);
    const total = sessionTotal(state, c.sessionId);
    if (!session || session.payment !== 'unpaid')
      return 'Phiên đã ghi nhận thu tiền hoặc đã thanh toán.';
    if (total <= 0 || !Number.isSafeInteger(c.amount) || c.amount < total)
      return 'Số tiền nhận phải là số nguyên và đủ tổng tiền cần thu.';
    session.payment = 'pending_settlement';
    session.cashReceived = c.amount;
    state.logs.unshift({
      id: c.id,
      time: c.now,
      text: `Thu hộ ${money(total)}. Chờ bàn giao và xác nhận từ thu ngân.`,
    });
  } else if (c.type === 'reservation') {
    const reservation = state.reservations.find(
      (r) => r.id === c.reservationId,
    );
    if (!reservation || reservation.status !== 'pending')
      return 'Yêu cầu đặt bàn đã được xử lý.';
    if (c.decision === 'confirmed') {
      const table = state.tables.find((t) => t.id === c.tableId);
      if (
        !table ||
        !table.active ||
        table.needsCleaning ||
        table.capacity < reservation.guests ||
        (table.sessionId && reservation.time < c.now + 90 * 60000)
      )
        return 'Bàn chưa phù hợp hoặc chưa trống cho khung giờ này.';
      if (reservation.time < c.now)
        return 'Giờ hẹn đã qua. Cần liên hệ khách trước khi duyệt.';
      if (
        state.reservations.some(
          (r) =>
            r.id !== reservation.id &&
            r.status === 'confirmed' &&
            r.tableId === table.id &&
            Math.abs(r.time - reservation.time) < 120 * 60000,
        )
      )
        return 'Bàn đã có lịch đặt trong khung giờ này.';
      reservation.tableId = table.id;
    } else {
      if (!c.reason?.trim()) return 'Vui lòng nhập lý do từ chối.';
      reservation.reason = c.reason.trim();
    }
    reservation.status = c.decision;
    state.logs.unshift({
      id: c.id,
      time: c.now,
      text: `${c.decision === 'confirmed' ? 'Xác nhận' : 'Từ chối'} đặt bàn của ${reservation.name}.`,
    });
  }
  return null;
}
