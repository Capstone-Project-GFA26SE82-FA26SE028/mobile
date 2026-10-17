import type { CustomerOrder } from '../ordering/types';
import type { WaiterProfile } from '../auth/data/demo';

export type Dish = {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  image: number;
};
export type DiningTable = {
  id: string;
  name: string;
  area: string;
  capacity: number;
  active: boolean;
  needsCleaning: boolean;
  sessionId: string | null;
};
export type Session = {
  id: string;
  tableId: string;
  guests: number;
  openedAt: number;
  prebillPrinted: boolean;
  payment: 'unpaid' | 'pending_settlement' | 'paid';
  cashReceived?: number;
};
export type OrderItem = {
  id: string;
  sessionId: string;
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  served: number;
  note: string;
  status: 'Pending' | 'Cooking' | 'Ready' | 'Served' | 'Cancelled';
  readyAt?: number;
  seen: boolean;
  servings?: { id: string; waiterId: string; waiterName: string; quantity: number; time: number }[];
};
export type ServiceRequest = {
  id: string;
  sessionId: string;
  type: string;
  note: string;
  createdAt: number;
  status: 'new' | 'processing' | 'done';
};
export type Reservation = {
  id: string;
  name: string;
  phone: string;
  guests: number;
  time: number;
  note: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'arrived';
  tableId?: string;
  reason?: string;
};
export type WaiterState = {
  signedIn: boolean;
  waiter: WaiterProfile | null;
  alerts: boolean;
  tables: DiningTable[];
  sessions: Session[];
  items: OrderItem[];
  customerOrders: CustomerOrder[];
  requests: ServiceRequest[];
  reservations: Reservation[];
  logs: { id: string; text: string; time: number }[];
  feedback: { id: string; text: string; error: boolean } | null;
};
export type DraftLine = { dishId: string; quantity: number; note: string };
export type Command = { id: string; now: number } & (
  | { type: 'open'; tableId: string; guests: number; reservationId?: string }
  | { type: 'move'; sessionId: string; tableId: string; reason: string }
  | { type: 'order'; sessionId: string; lines: DraftLine[] }
  | { type: 'confirm-order'; orderId: string; version: number }
  | { type: 'cancel'; itemId: string; reason: string }
  | { type: 'serve'; itemId: string; quantity: number; expectedServed?: number }
  | { type: 'seen'; itemId: string }
  | { type: 'request'; requestId: string; status: 'processing' | 'done' }
  | { type: 'collect'; sessionId: string; amount: number }
  | {
      type: 'reservation';
      reservationId: string;
      decision: 'confirmed' | 'rejected';
      tableId?: string;
      reason?: string;
    }
);
