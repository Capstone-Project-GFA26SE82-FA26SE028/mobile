import type { Order } from '../types/api';

export function isConfirmedOrder(order: Pick<Order, 'status'>) {
  return ['Confirmed', 'Ready', 'Served'].includes(order.status);
}

export function confirmedOrderTotal(
  orders: Pick<Order, 'status' | 'totalAmount'>[],
) {
  return orders
    .filter(isConfirmedOrder)
    .reduce((sum, order) => sum + order.totalAmount, 0);
}
