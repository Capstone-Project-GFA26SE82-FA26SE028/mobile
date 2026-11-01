import type { Selection } from './api';

export type CartLine = Selection & {
  id: string;
  name: string;
  price: number;
  optionNames: string[];
};
export type WaiterCart = {
  tableId: string;
  sessionId: string;
  lines: CartLine[];
  requestKey?: string;
  status: 'draft' | 'sending' | 'uncertain';
  error?: string;
};
export type CartState = { carts: Record<string, WaiterCart> };
